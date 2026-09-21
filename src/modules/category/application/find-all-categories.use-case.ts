import { Page, SoftDeleteListParams } from '../../../shared/pagination/pagination.types';
import { Category } from '../domain/category.entity';
import { CategoryRepository } from '../domain/category.repository';

export class FindAllCategoriesUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  execute(params: SoftDeleteListParams): Promise<Page<Category>> {
    return this.categoryRepository.findAll(params);
  }
}
