import { AppError } from '../../../shared/errors/AppError';
import { CategoryRepository } from '../../category/domain/category.repository';
import { PhotoRepository } from '../../photo/domain/photo.repository';
import { Product } from '../domain/product.entity';
import { ProductRepository } from '../domain/product.repository';
import { CreateProductDto } from './create-product.dto';
import { findCategoryOrFail, findPhotosOrFail } from './product-references';

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly photoRepository: PhotoRepository,
  ) {}

  async execute(input: CreateProductDto): Promise<Product> {
    const category = await findCategoryOrFail(this.categoryRepository, input.category.id);
    const photos = await findPhotosOrFail(
      this.photoRepository,
      (input.photos ?? []).map((photo) => photo.id),
    );

    const product = new Product();
    product.name = input.name;
    product.description = input.description ?? null;
    product.price = input.price.toFixed(2);
    product.in_stock = input.in_stock ?? true;
    product.category = category;
    product.photos = photos;

    const saved = await this.productRepository.save(product);

    const full = await this.productRepository.findById(saved.id);
    if (!full) {
      throw new AppError('Error al crear el producto', 500);
    }
    return full;
  }
}
