import { AppError } from '../../../shared/errors/AppError';
import { Category } from '../domain/category.entity';
import { CategoryRepository } from '../domain/category.repository';

export class FindCategoryByIdUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(id: number): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppError('Categoría no encontrada', 404);
    }
    return category;
  }
}
