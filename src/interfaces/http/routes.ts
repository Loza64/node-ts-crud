import { Router } from 'express';
import { Container } from '../../composition-root';
import healthRoutes from '../../modules/health/infrastructure/http/health.routes';
import { buildPhotoRouter, buildLegacyFileRouter } from '../../modules/photo/infrastructure/http/photo.routes';
import { buildProductRouter } from '../../modules/product/infrastructure/http/product.routes';
import { buildCategoryRouter } from '../../modules/category/infrastructure/http/category.routes';

export const buildApiRouter = (container: Container): Router => {
  const router = Router();

  router.use('/health', healthRoutes);
  router.use('/products', buildProductRouter(container.resolve('productController')));
  router.use('/categories', buildCategoryRouter(container.resolve('categoryController')));
  router.use('/photos', buildPhotoRouter(container.resolve('photoController')));
  router.use('/files', buildLegacyFileRouter(container.resolve('photoController')));

  return router;
};
