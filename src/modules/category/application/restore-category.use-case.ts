import { AppError } from '../../../shared/errors/AppError';
import { Category } from '../domain/category.entity';
import { CategoryRepository } from '../domain/category.repository';

export class RestoreCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(id: number): Promise<Category> {
    const category = await this.categoryRepository.findById(id, true);
    if (!category) {
      throw new AppError('Categoría no encontrada', 404);
    }
    if (category.deletedAt === null) {
      throw new AppError('La categoría no está eliminada', 409);
    }

    await this.categoryRepository.restore(id);

    const restored = await this.categoryRepository.findById(id);
    if (!restored) {
      throw new AppError('Error al restaurar la categoría', 500);
    }
    return restored;
  }
}
