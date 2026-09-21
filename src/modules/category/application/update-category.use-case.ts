import { AppError } from '../../../shared/errors/AppError';
import { Category } from '../domain/category.entity';
import { CategoryRepository } from '../domain/category.repository';
import { UpdateCategoryDto } from './update-category.dto';

export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(id: number, input: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppError('Categoría no encontrada', 404);
    }

    if (input.name !== undefined) category.name = input.name;
    if (input.description !== undefined) category.description = input.description;

    const saved = await this.categoryRepository.save(category);
    return (await this.categoryRepository.findById(saved.id)) ?? saved;
  }
}
