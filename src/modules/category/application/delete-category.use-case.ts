import { AppError } from '../../../shared/errors/AppError';
import { ProductRepository } from '../../product/domain/product.repository';
import { CategoryRepository } from '../domain/category.repository';

export class DeleteCategoryUseCase {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppError('Categoría no encontrada', 404);
    }

    if (await this.productRepository.existsByCategory(id)) {
      throw new AppError(
        'No se puede eliminar la categoría porque tiene productos activos; elimínalos o muévelos a otra categoría primero',
        409,
      );
    }

    await this.categoryRepository.softDelete(id);
  }
}
