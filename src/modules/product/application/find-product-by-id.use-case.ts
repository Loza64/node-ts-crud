import { AppError } from '../../../shared/errors/AppError';
import { Product } from '../domain/product.entity';
import { ProductRepository } from '../domain/product.repository';

export class FindProductByIdUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: number): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }
    return product;
  }
}
