import { Page } from '../../../shared/pagination/pagination.types';
import { Product } from '../domain/product.entity';
import { ProductFindAllParams, ProductRepository } from '../domain/product.repository';

export class FindAllProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  execute(params: ProductFindAllParams): Promise<Page<Product>> {
    return this.productRepository.findAll(params);
  }
}
