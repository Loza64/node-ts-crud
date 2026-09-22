import { AppError } from '../../../shared/errors/AppError';
import { CategoryRepository } from '../../category/domain/category.repository';
import { Product } from '../domain/product.entity';
import { ProductRepository } from '../domain/product.repository';

export class RestoreProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(id: number): Promise<Product> {
    const product = await this.productRepository.findById(id, true);
    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }
    if (product.deletedAt === null) {
      throw new AppError('El producto no está eliminado', 409);
    }

    const category = await this.categoryRepository.findById(product.category.id);
    if (!category) {
      throw new AppError(
        'No se puede restaurar el producto porque su categoría está eliminada; restaura la categoría primero',
        409,
      );
    }

    await this.productRepository.restore(id);

    const restored = await this.productRepository.findById(id);
    if (!restored) {
      throw new AppError('Error al restaurar el producto', 500);
    }
    return restored;
  }
}
