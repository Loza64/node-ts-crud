import { Router } from 'express';
import { validateDTO } from '../../../../shared/middlewares/validate-dto.middleware';
import { validateQuery } from '../../../../shared/middlewares/validate-query.middleware';
import { validateIdParam } from '../../../../shared/middlewares/validate-id-param.middleware';
import { SoftDeleteQueryDto } from '../../../../shared/pagination/pagination-query.dto';
import { CreateCategoryDto } from '../../application/create-category.dto';
import { UpdateCategoryDto } from '../../application/update-category.dto';
import { CategoryController } from './category.controller';

export const buildCategoryRouter = (controller: CategoryController): Router => {
  const router = Router();

  router.param('id', validateIdParam);

  /**
   * @swagger
   * /api/categories:
   *   get:
   *     summary: Lista categorías (paginado)
   *     tags: [Categories]
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
   *         name: status
   *         schema: { type: string, enum: [active, deleted, all], default: active }
   *     responses:
   *       200:
   *         description: Listado paginado de categorías
   */
  router.get('/', validateQuery(SoftDeleteQueryDto), controller.findAll);

  /**
   * @swagger
   * /api/categories/{id}:
   *   get:
   *     summary: Busca una categoría por id
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Categoría encontrada
   *       404:
   *         description: Categoría no encontrada
   */
  router.get('/:id', controller.findOne);

  /**
   * @swagger
   * /api/categories:
   *   post:
   *     summary: Crea una categoría
   *     tags: [Categories]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCategoryDto'
   *     responses:
   *       201:
   *         description: Categoría creada
   *       400:
   *         description: Error de validación
   */
  router.post('/', validateDTO(CreateCategoryDto), controller.create);

  /**
   * @swagger
   * /api/categories/{id}:
   *   patch:
   *     summary: Actualiza una categoría
   *     tags: [Categories]
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
   *             $ref: '#/components/schemas/UpdateCategoryDto'
   *     responses:
   *       200:
   *         description: Categoría actualizada
   *       400:
   *         description: Error de validación
   *       404:
   *         description: Categoría no encontrada
   */
  router.patch('/:id', validateDTO(UpdateCategoryDto), controller.update);

  /**
   * @swagger
   * /api/categories/{id}/restore:
   *   patch:
   *     summary: Restaura una categoría eliminada (soft delete)
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Categoría restaurada
   *       404:
   *         description: Categoría no encontrada
   */
  router.patch('/:id/restore', controller.restore);

  /**
   * @swagger
   * /api/categories/{id}:
   *   delete:
   *     summary: Elimina una categoría (soft delete)
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       204:
   *         description: Categoría eliminada
   *       404:
   *         description: Categoría no encontrada
   */
  router.delete('/:id', controller.remove);

  return router;
};
