/// <reference types="jest" />

import { Category } from '../../category/domain/category.entity';
import { CategoryRepository } from '../../category/domain/category.repository';
import { Product } from '../domain/product.entity';
import { ProductRepository } from '../domain/product.repository';
import { RestoreProductUseCase } from './restore-product.use-case';

const makeProduct = (deletedAt: Date | null) =>
  Object.assign(new Product(), { id: 5, deletedAt, category: Object.assign(new Category(), { id: 2 }) });

describe('RestoreProductUseCase', () => {
  const productRepository = {
    findById: jest.fn(),
    restore: jest.fn(),
  } as unknown as jest.Mocked<ProductRepository>;
  const categoryRepository = { findById: jest.fn() } as unknown as jest.Mocked<CategoryRepository>;
  const useCase = new RestoreProductUseCase(productRepository, categoryRepository);

  beforeEach(() => jest.resetAllMocks());

  it('404 when the product does not exist', async () => {
    productRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(5)).rejects.toMatchObject({ statusCode: 404 });
    expect(productRepository.findById).toHaveBeenCalledWith(5, true);
  });

  it('409 when the product is not deleted', async () => {
    productRepository.findById.mockResolvedValue(makeProduct(null));

    await expect(useCase.execute(5)).rejects.toMatchObject({ statusCode: 409 });
    expect(productRepository.restore).not.toHaveBeenCalled();
  });

  it('409 when its category is still deleted', async () => {
    productRepository.findById.mockResolvedValue(makeProduct(new Date()));
    categoryRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(5)).rejects.toMatchObject({ statusCode: 409 });
    expect(categoryRepository.findById).toHaveBeenCalledWith(2);
    expect(productRepository.restore).not.toHaveBeenCalled();
  });

  it('restores a deleted product whose category is active', async () => {
    const restored = makeProduct(null);
    productRepository.findById.mockResolvedValueOnce(makeProduct(new Date())).mockResolvedValueOnce(restored);
    categoryRepository.findById.mockResolvedValue(Object.assign(new Category(), { id: 2 }));

    await expect(useCase.execute(5)).resolves.toBe(restored);
    expect(productRepository.restore).toHaveBeenCalledWith(5);
  });
});
