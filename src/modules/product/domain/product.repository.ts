import { Page, SoftDeleteListParams } from '../../../shared/pagination/pagination.types';
import { Product } from './product.entity';

export interface ProductFindAllParams extends SoftDeleteListParams {
  categoryId?: number;
}

export interface ProductRepository {
  findAll(params: ProductFindAllParams): Promise<Page<Product>>;
  /** Por defecto ignora los eliminados; con withDeleted=true los incluye. */
  findById(id: number, withDeleted?: boolean): Promise<Product | null>;
  /** true si la categoria tiene al menos un producto ACTIVO (no eliminado). */
  existsByCategory(categoryId: number): Promise<boolean>;
  save(product: Product): Promise<Product>;
  softDelete(id: number): Promise<void>;
  restore(id: number): Promise<void>;
}
