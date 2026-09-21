import { Category } from '../domain/category.entity';
import { CategoryRepository } from '../domain/category.repository';
import { CreateCategoryDto } from './create-category.dto';

export class CreateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: CreateCategoryDto): Promise<Category> {
    const category = new Category();
    category.name = input.name;
    category.description = input.description ?? null;

    const saved = await this.categoryRepository.save(category);
    return (await this.categoryRepository.findById(saved.id)) ?? saved;
  }
}
