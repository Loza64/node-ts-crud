import { AppError } from '../../../shared/errors/AppError';
import { ProductRepository } from '../domain/product.repository';

export class DeleteProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: number): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    await this.productRepository.softDelete(id);
  }
}
