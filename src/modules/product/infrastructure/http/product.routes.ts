import { Router } from 'express';
import { validateDTO } from '../../../../shared/middlewares/validate-dto.middleware';
import { validateQuery } from '../../../../shared/middlewares/validate-query.middleware';
import { validateIdParam } from '../../../../shared/middlewares/validate-id-param.middleware';
import { CreateProductDto } from '../../application/create-product.dto';
import { UpdateProductDto } from '../../application/update-product.dto';
import { ProductQueryDto } from '../../application/product-query.dto';
import { ProductController } from './product.controller';

export const buildProductRouter = (controller: ProductController): Router => {
  const router = Router();

  router.param('id', validateIdParam);

  /**
   * @swagger
   * /api/products:
   *   get:
   *     summary: Lista productos (paginado)
   *     tags: [Products]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: pageSize
   *         schema: { type: integer, default: 10 }
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *       - in: query
   *         name: delete
   *         description: true para listar solo los eliminados; si se omite, solo activos
   *         schema: { type: boolean, default: false }
   *       - in: query
   *         name: category
   *         description: Filtrar por ID de categoría
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Listado paginado de productos
   */
  router.get('/', validateQuery(ProductQueryDto), controller.findAll);

  /**
   * @swagger
   * /api/products/{id}:
   *   get:
   *     summary: Busca un producto por id
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Producto encontrado
   *       404:
   *         description: Producto no encontrado
   */
  router.get('/:id', controller.findOne);

  /**
   * @swagger
   * /api/products:
   *   post:
   *     summary: Crea un producto
   *     tags: [Products]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateProductDto'
   *     responses:
   *       201:
   *         description: Producto creado
   *       400:
   *         description: Error de validación
   */
  router.post('/', validateDTO(CreateProductDto), controller.create);

  /**
   * @swagger
   * /api/products/{id}:
   *   patch:
   *     summary: Actualiza un producto
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateProductDto'
   *     responses:
   *       200:
   *         description: Producto actualizado
   *       400:
   *         description: Error de validación
   *       404:
   *         description: Producto no encontrado
   */
  router.patch('/:id', validateDTO(UpdateProductDto), controller.update);

  /**
   * @swagger
   * /api/products/{id}/restore:
   *   patch:
   *     summary: Restaura un producto eliminado (soft delete)
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Producto restaurado
   *       404:
   *         description: Producto no encontrado
   */
  router.patch('/:id/restore', controller.restore);

  /**
   * @swagger
   * /api/products/{id}:
   *   delete:
   *     summary: Elimina un producto (soft delete)
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       204:
   *         description: Producto eliminado
   *       404:
   *         description: Producto no encontrado
   */
  router.delete('/:id', controller.remove);

  return router;
};
