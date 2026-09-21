/// <reference types="jest" />

import { ProductRepository } from '../../product/domain/product.repository';
import { Category } from '../domain/category.entity';
import { CategoryRepository } from '../domain/category.repository';
import { DeleteCategoryUseCase } from './delete-category.use-case';
import { RestoreCategoryUseCase } from './restore-category.use-case';

const makeCategory = (deletedAt: Date | null) => Object.assign(new Category(), { id: 4, deletedAt });

describe('category business rules', () => {
  const categoryRepository = {
    findById: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
  } as unknown as jest.Mocked<CategoryRepository>;
  const productRepository = { existsByCategory: jest.fn() } as unknown as jest.Mocked<ProductRepository>;

  beforeEach(() => jest.resetAllMocks());

  describe('DeleteCategoryUseCase', () => {
    const useCase = new DeleteCategoryUseCase(categoryRepository, productRepository);

    it('404 when the category does not exist', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(4)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('409 when the category still has active products', async () => {
      categoryRepository.findById.mockResolvedValue(makeCategory(null));
      productRepository.existsByCategory.mockResolvedValue(true);

      await expect(useCase.execute(4)).rejects.toMatchObject({ statusCode: 409 });
      expect(categoryRepository.softDelete).not.toHaveBeenCalled();
    });

    it('soft deletes a category without active products', async () => {
      categoryRepository.findById.mockResolvedValue(makeCategory(null));
      productRepository.existsByCategory.mockResolvedValue(false);

      await useCase.execute(4);

      expect(categoryRepository.softDelete).toHaveBeenCalledWith(4);
    });
  });

  describe('RestoreCategoryUseCase', () => {
    const useCase = new RestoreCategoryUseCase(categoryRepository);

    it('404 when the category does not exist', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(4)).rejects.toMatchObject({ statusCode: 404 });
      expect(categoryRepository.findById).toHaveBeenCalledWith(4, true);
    });

    it('409 when the category is not deleted', async () => {
      categoryRepository.findById.mockResolvedValue(makeCategory(null));

      await expect(useCase.execute(4)).rejects.toMatchObject({ statusCode: 409 });
      expect(categoryRepository.restore).not.toHaveBeenCalled();
    });

    it('restores a deleted category', async () => {
      const restored = makeCategory(null);
      categoryRepository.findById.mockResolvedValueOnce(makeCategory(new Date())).mockResolvedValueOnce(restored);

      await expect(useCase.execute(4)).resolves.toBe(restored);
      expect(categoryRepository.restore).toHaveBeenCalledWith(4);
    });
  });
});
