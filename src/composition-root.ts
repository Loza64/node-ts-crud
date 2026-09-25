import { CloudinaryFileStorage } from './shared/cloudinary/cloudinary.adapter';
import { env } from './shared/config/env';

import { TypeOrmPhotoRepository } from './modules/photo/infrastructure/persistence/typeorm-photo.repository';
import { UploadFilesUseCase } from './modules/photo/application/upload-files.use-case';
import { FindAllPhotosUseCase } from './modules/photo/application/find-all-photos.use-case';
import { FindPhotoByIdUseCase } from './modules/photo/application/find-photo-by-id.use-case';
import { DeletePhotoUseCase } from './modules/photo/application/delete-photo.use-case';
import { CleanupOrphanPhotosUseCase } from './modules/photo/application/cleanup-orphan-photos.use-case';
import { PhotoController } from './modules/photo/infrastructure/http/photo.controller';

import { TypeOrmProductRepository } from './modules/product/infrastructure/persistence/typeorm-product.repository';
import { CreateProductUseCase } from './modules/product/application/create-product.use-case';
import { UpdateProductUseCase } from './modules/product/application/update-product.use-case';
import { DeleteProductUseCase } from './modules/product/application/delete-product.use-case';
import { RestoreProductUseCase } from './modules/product/application/restore-product.use-case';
import { FindAllProductsUseCase } from './modules/product/application/find-all-products.use-case';
import { FindProductByIdUseCase } from './modules/product/application/find-product-by-id.use-case';
import { ProductController } from './modules/product/infrastructure/http/product.controller';

import { TypeOrmCategoryRepository } from './modules/category/infrastructure/persistence/typeorm-category.repository';
import { CreateCategoryUseCase } from './modules/category/application/create-category.use-case';
import { UpdateCategoryUseCase } from './modules/category/application/update-category.use-case';
import { DeleteCategoryUseCase } from './modules/category/application/delete-category.use-case';
import { RestoreCategoryUseCase } from './modules/category/application/restore-category.use-case';
import { FindAllCategoriesUseCase } from './modules/category/application/find-all-categories.use-case';
import { FindCategoryByIdUseCase } from './modules/category/application/find-category-by-id.use-case';
import { CategoryController } from './modules/category/infrastructure/http/category.controller';

export const buildContainer = () => {

  const categoryRepository = new TypeOrmCategoryRepository();
  const photoRepository = new TypeOrmPhotoRepository();
  const productRepository = new TypeOrmProductRepository();

  const fileStorage = new CloudinaryFileStorage();
  const uploadFilesUseCase = new UploadFilesUseCase(fileStorage, photoRepository, env.CLOUDINARY_FOLDER);
  const findAllPhotosUseCase = new FindAllPhotosUseCase(photoRepository);
  const findPhotoByIdUseCase = new FindPhotoByIdUseCase(photoRepository);
  const deletePhotoUseCase = new DeletePhotoUseCase(photoRepository, fileStorage);
  const cleanupOrphanPhotosUseCase = new CleanupOrphanPhotosUseCase(
    photoRepository,
    deletePhotoUseCase,
    env.ORPHAN_PHOTOS_MIN_AGE_MINUTES,
  );
  const photoController = new PhotoController(
    uploadFilesUseCase,
    findAllPhotosUseCase,
    findPhotoByIdUseCase,
    deletePhotoUseCase,
    cleanupOrphanPhotosUseCase,
  );

  const createCategoryUseCase = new CreateCategoryUseCase(categoryRepository);
  const updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepository);
  const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepository, productRepository);
  const restoreCategoryUseCase = new RestoreCategoryUseCase(categoryRepository);
  const findAllCategoriesUseCase = new FindAllCategoriesUseCase(categoryRepository);
  const findCategoryByIdUseCase = new FindCategoryByIdUseCase(categoryRepository);
  const categoryController = new CategoryController(
    createCategoryUseCase,
    updateCategoryUseCase,
    deleteCategoryUseCase,
    restoreCategoryUseCase,
    findAllCategoriesUseCase,
    findCategoryByIdUseCase,
  );

  const createProductUseCase = new CreateProductUseCase(productRepository, categoryRepository, photoRepository);
  const updateProductUseCase = new UpdateProductUseCase(productRepository, categoryRepository, photoRepository, deletePhotoUseCase);
  const deleteProductUseCase = new DeleteProductUseCase(productRepository);
  const restoreProductUseCase = new RestoreProductUseCase(productRepository, categoryRepository);
  const findAllProductsUseCase = new FindAllProductsUseCase(productRepository);
  const findProductByIdUseCase = new FindProductByIdUseCase(productRepository);
  const productController = new ProductController(
    createProductUseCase,
    updateProductUseCase,
    deleteProductUseCase,
    restoreProductUseCase,
    findAllProductsUseCase,
    findProductByIdUseCase,
  );

  return {
    photoController,
    productController,
    categoryController,
    cleanupOrphanPhotosUseCase,
  };
};

export type Container = ReturnType<typeof buildContainer>;
