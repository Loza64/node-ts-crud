import { Page, SoftDeleteListParams } from '../../../shared/pagination/pagination.types';
import { Product } from './product.entity';

export interface ProductFindAllParams extends SoftDeleteListParams {
  categoryId?: number;
}

export interface ProductRepository {
  findAll(params: ProductFindAllParams): Promise<Page<Product>>;

  findById(id: number, withDeleted?: boolean): Promise<Product | null>;

  existsByCategory(categoryId: number): Promise<boolean>;
  save(product: Product): Promise<Product>;
  softDelete(id: number): Promise<void>;
  restore(id: number): Promise<void>;
}
