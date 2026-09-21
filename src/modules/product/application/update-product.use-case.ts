import { AppError } from '../../../shared/errors/AppError';
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
  ) { }

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
      const keptPhotoIds = new Set(input.photos.map((photo) => photo.id));
      const removedPhotoIds = previousPhotoIds.filter((photoId) => !keptPhotoIds.has(photoId));

      for (const photoId of removedPhotoIds) {
        await this.deletePhotoUseCase.execute(photoId);
      }
    }

    const full = await this.productRepository.findById(saved.id);
    if (!full) {
      throw new AppError('Error al actualizar el producto', 500);
    }
    return full;
  }
}
