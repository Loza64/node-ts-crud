/// <reference types="jest" />

import { CategoryRepository } from '../../category/domain/category.repository';
import { Category } from '../../category/domain/category.entity';
import { Photo } from '../../photo/domain/photo.entity';
import { PhotoRepository } from '../../photo/domain/photo.repository';
import { Product } from '../domain/product.entity';
import { ProductRepository } from '../domain/product.repository';
import { CreateProductUseCase } from './create-product.use-case';

const makeCategory = (id: number) => Object.assign(new Category(), { id, name: `cat-${id}` });
const makePhoto = (id: number) => Object.assign(new Photo(), { id });

describe('CreateProductUseCase', () => {
  const productRepository = {
    save: jest.fn(async (product: Product) => Object.assign(product, { id: 10 })),
    findById: jest.fn(),
  } as unknown as jest.Mocked<ProductRepository>;
  const categoryRepository = { findById: jest.fn() } as unknown as jest.Mocked<CategoryRepository>;
  const photoRepository = { findByIds: jest.fn() } as unknown as jest.Mocked<PhotoRepository>;

  const useCase = new CreateProductUseCase(productRepository, categoryRepository, photoRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    productRepository.findById.mockImplementation(async (id: number) =>
      Object.assign(new Product(), { id }),
    );
  });

  it('creates the product resolving category and photos from their { id } references', async () => {
    categoryRepository.findById.mockResolvedValue(makeCategory(1));
    photoRepository.findByIds.mockResolvedValue([makePhoto(1), makePhoto(3)]);

    await useCase.execute({
      name: 'Camisa',
      description: 'Algodón',
      price: 19.9,
      in_stock: false,
      category: { id: 1 },
    });

    expect(categoryRepository.findById).toHaveBeenCalledWith(1);
    const saved = productRepository.save.mock.calls[0][0];
    expect(saved).toMatchObject({ name: 'Camisa', description: 'Algodón', price: '19.90', in_stock: false });
    expect(saved.category.id).toBe(1);
  });

  it('defaults in_stock to true, description to null and photos to []', async () => {
    categoryRepository.findById.mockResolvedValue(makeCategory(2));

    await useCase.execute({ name: 'Camisa', price: 10, category: { id: 2 } });

    const saved = productRepository.save.mock.calls[0][0];
    expect(saved).toMatchObject({ in_stock: true, description: null, price: '10.00' });
    expect(saved.photos).toEqual([]);
    expect(photoRepository.findByIds).not.toHaveBeenCalled();
  });

  it('fails with 404 when the category does not exist (or is deleted)', async () => {
    categoryRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ name: 'Camisa', price: 10, category: { id: 99 } })).rejects.toMatchObject({
      statusCode: 404,
      message: expect.stringContaining('99'),
    });
    expect(productRepository.save).not.toHaveBeenCalled();
  });

  it('fails with 404 naming the photo ids that do not exist', async () => {
    categoryRepository.findById.mockResolvedValue(makeCategory(1));
    photoRepository.findByIds.mockResolvedValue([makePhoto(1)]);

    await expect(
      useCase.execute({ name: 'Camisa', price: 10, category: { id: 1 }, photos: [{ id: 1 }, { id: 7 }, { id: 8 }] }),
    ).rejects.toMatchObject({ statusCode: 404, message: 'Fotos no encontradas: 7, 8' });
    expect(productRepository.save).not.toHaveBeenCalled();
  });
});
