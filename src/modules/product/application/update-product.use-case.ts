import { AppError } from '../../../shared/errors/AppError';
import { errorLog } from '../../../shared/logger/logger';
import { CategoryRepository } from '../../category/domain/category.repository';
import { PhotoRepository } from '../../photo/domain/photo.repository';
import { DeletePhotoUseCase } from '../../photo/application/delete-photo.use-case';
import { Product } from '../domain/product.entity';
import { ProductRepository } from '../domain/product.repository';
import { findCategoryOrFail, findPhotosOrFail } from './product-references';
import { UpdateProductDto } from './update-product.dto';

export class UpdateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly photoRepository: PhotoRepository,
    private readonly deletePhotoUseCase: DeletePhotoUseCase,
  ) {}

  async execute(id: number, input: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    const previousPhotoIds = (product.photos ?? []).map((photo) => photo.id);

    if (input.name !== undefined) product.name = input.name;
    if (input.description !== undefined) product.description = input.description;
    if (input.price !== undefined) product.price = input.price.toFixed(2);
    if (input.in_stock !== undefined) product.in_stock = input.in_stock;

    if (input.category !== undefined) {
      product.category = await findCategoryOrFail(this.categoryRepository, input.category.id);
    }

    if (input.photos !== undefined) {
      product.photos = await findPhotosOrFail(
        this.photoRepository,
        input.photos.map((photo) => photo.id),
      );
    }

    const saved = await this.productRepository.save(product);

    if (input.photos !== undefined) {
      const keptPhotoIds = input.photos.map((photo) => photo.id);
      await this.photoRepository.markAttached(keptPhotoIds);

      const keptPhotoIdsSet = new Set(keptPhotoIds);
      const removedPhotoIds = previousPhotoIds.filter((photoId) => !keptPhotoIdsSet.has(photoId));

      await this.deleteRemovedPhotos(id, removedPhotoIds);
    }

    const full = await this.productRepository.findById(saved.id);
    if (!full) {
      throw new AppError('Error al actualizar el producto', 500);
    }
    return full;
  }

  private async deleteRemovedPhotos(productId: number, photoIds: number[]): Promise<void> {
    if (!photoIds.length) return;

    const results = await Promise.allSettled(
      photoIds.map((photoId) => this.deletePhotoUseCase.execute(photoId)),
    );

    const failed = results
      .map((result, index) => ({ result, photoId: photoIds[index] }))
      .filter(
        (entry): entry is { result: PromiseRejectedResult; photoId: number } =>
          entry.result.status === 'rejected',
      );

    if (!failed.length) return;

    failed.forEach(({ result, photoId }) => {
      errorLog(
        'No se pudo eliminar la foto %s tras actualizar el producto %s: %O',
        photoId,
        productId,
        result.reason,
      );
    });

    throw new AppError(
      `El producto se actualizó, pero no se pudieron eliminar ${failed.length} foto(s) ` +
        `desasociadas (id: ${failed.map((f) => f.photoId).join(', ')}). Intenta borrarlas de nuevo.`,
      502,
    );
  }
}
