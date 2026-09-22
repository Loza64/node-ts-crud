import { Page, SoftDeleteListParams } from '../../../shared/pagination/pagination.types';
import { Category } from './category.entity';

export interface CategoryRepository {
  findAll(params: SoftDeleteListParams): Promise<Page<Category>>;

  findById(id: number, withDeleted?: boolean): Promise<Category | null>;
  save(category: Category): Promise<Category>;
  softDelete(id: number): Promise<void>;
  restore(id: number): Promise<void>;
}
