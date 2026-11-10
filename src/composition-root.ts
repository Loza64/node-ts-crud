import {
  asClass,
  asValue,
  createContainer,
  InjectionMode,
  Lifetime,
  type AwilixContainer,
} from 'awilix';
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

export interface Cradle {
  categoryRepository: TypeOrmCategoryRepository;
  photoRepository: TypeOrmPhotoRepository;
  productRepository: TypeOrmProductRepository;
  fileStorage: CloudinaryFileStorage;
  folder: string;
  minPendingAgeMinutes: number;
  uploadFilesUseCase: UploadFilesUseCase;
  findAllPhotosUseCase: FindAllPhotosUseCase;
  findPhotoByIdUseCase: FindPhotoByIdUseCase;
  deletePhotoUseCase: DeletePhotoUseCase;
  cleanupOrphanPhotosUseCase: CleanupOrphanPhotosUseCase;
  photoController: PhotoController;
  createCategoryUseCase: CreateCategoryUseCase;
  updateCategoryUseCase: UpdateCategoryUseCase;
  deleteCategoryUseCase: DeleteCategoryUseCase;
  restoreCategoryUseCase: RestoreCategoryUseCase;
  findAllCategoriesUseCase: FindAllCategoriesUseCase;
  findCategoryByIdUseCase: FindCategoryByIdUseCase;
  categoryController: CategoryController;
  createProductUseCase: CreateProductUseCase;
  updateProductUseCase: UpdateProductUseCase;
  deleteProductUseCase: DeleteProductUseCase;
  restoreProductUseCase: RestoreProductUseCase;
  findAllProductsUseCase: FindAllProductsUseCase;
  findProductByIdUseCase: FindProductByIdUseCase;
  productController: ProductController;
}

export type Container = AwilixContainer<Cradle>;

export const buildContainer = (): Container => {
  // CLASSIC resolves constructor dependencies by their parameter names.
  const container = createContainer<Cradle>({
    injectionMode: InjectionMode.CLASSIC,
  });

  container.register({
    categoryRepository: asClass(TypeOrmCategoryRepository, { lifetime: Lifetime.SINGLETON }),
    photoRepository: asClass(TypeOrmPhotoRepository, { lifetime: Lifetime.SINGLETON }),
    productRepository: asClass(TypeOrmProductRepository, { lifetime: Lifetime.SINGLETON }),
    fileStorage: asClass(CloudinaryFileStorage, { lifetime: Lifetime.SINGLETON }),

    uploadFilesUseCase: asClass(UploadFilesUseCase, { lifetime: Lifetime.SINGLETON }),
    findAllPhotosUseCase: asClass(FindAllPhotosUseCase, { lifetime: Lifetime.SINGLETON }),
    findPhotoByIdUseCase: asClass(FindPhotoByIdUseCase, { lifetime: Lifetime.SINGLETON }),
    deletePhotoUseCase: asClass(DeletePhotoUseCase, { lifetime: Lifetime.SINGLETON }),
    cleanupOrphanPhotosUseCase: asClass(CleanupOrphanPhotosUseCase, { lifetime: Lifetime.SINGLETON }),
    photoController: asClass(PhotoController, { lifetime: Lifetime.SINGLETON }),

    createCategoryUseCase: asClass(CreateCategoryUseCase, { lifetime: Lifetime.SINGLETON }),
    updateCategoryUseCase: asClass(UpdateCategoryUseCase, { lifetime: Lifetime.SINGLETON }),
    deleteCategoryUseCase: asClass(DeleteCategoryUseCase, { lifetime: Lifetime.SINGLETON }),
    restoreCategoryUseCase: asClass(RestoreCategoryUseCase, { lifetime: Lifetime.SINGLETON }),
    findAllCategoriesUseCase: asClass(FindAllCategoriesUseCase, { lifetime: Lifetime.SINGLETON }),
    findCategoryByIdUseCase: asClass(FindCategoryByIdUseCase, { lifetime: Lifetime.SINGLETON }),
    categoryController: asClass(CategoryController, { lifetime: Lifetime.SINGLETON }),

    createProductUseCase: asClass(CreateProductUseCase, { lifetime: Lifetime.SINGLETON }),
    updateProductUseCase: asClass(UpdateProductUseCase, { lifetime: Lifetime.SINGLETON }),
    deleteProductUseCase: asClass(DeleteProductUseCase, { lifetime: Lifetime.SINGLETON }),
    restoreProductUseCase: asClass(RestoreProductUseCase, { lifetime: Lifetime.SINGLETON }),
    findAllProductsUseCase: asClass(FindAllProductsUseCase, { lifetime: Lifetime.SINGLETON }),
    findProductByIdUseCase: asClass(FindProductByIdUseCase, { lifetime: Lifetime.SINGLETON }),
    productController: asClass(ProductController, { lifetime: Lifetime.SINGLETON }),

    folder: asValue(env.CLOUDINARY_FOLDER),
    minPendingAgeMinutes: asValue(env.ORPHAN_PHOTOS_MIN_AGE_MINUTES),
  });

  return container;
};
