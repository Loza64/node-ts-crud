import { Router } from 'express';
import { Container } from '../../composition-root';
import healthRoutes from '../../modules/health/infrastructure/http/health.routes';
import { buildPhotoRouter, buildLegacyFileRouter } from '../../modules/photo/infrastructure/http/photo.routes';
import { buildProductRouter } from '../../modules/product/infrastructure/http/product.routes';
import { buildCategoryRouter } from '../../modules/category/infrastructure/http/category.routes';

export const buildApiRouter = (container: Container): Router => {
  const router = Router();

  router.use('/health', healthRoutes);
  router.use('/products', buildProductRouter(container.productController));
  router.use('/categories', buildCategoryRouter(container.categoryController));
  router.use('/photos', buildPhotoRouter(container.photoController));
  router.use('/files', buildLegacyFileRouter(container.photoController));

  return router;
};
