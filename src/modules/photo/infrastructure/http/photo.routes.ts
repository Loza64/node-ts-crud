import { Router } from 'express';
import { uploadFile } from '../../../../shared/middlewares/upload-file.middleware';
import { validateQuery } from '../../../../shared/middlewares/validate-query.middleware';
import { validateIdParam } from '../../../../shared/middlewares/validate-id-param.middleware';
import { SearchQueryDto } from '../../../../shared/pagination/pagination-query.dto';
import { PhotoController } from './photo.controller';

export const buildPhotoRouter = (controller: PhotoController): Router => {
  const router = Router();

  router.param('id', validateIdParam);

  /**
   * @swagger
   * /api/photos:
   *   get:
   *     summary: Lista fotos (paginado)
   *     tags: [Photos]
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
   *     responses:
   *       200:
   *         description: Listado paginado de fotos
   */
  router.get('/', validateQuery(SearchQueryDto), controller.findAll);

  /**
   * @swagger
   * /api/photos/{id}:
   *   get:
   *     summary: Busca una foto por id
   *     tags: [Photos]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Foto encontrada
   *       404:
   *         description: Foto no encontrada
   */
  router.get('/:id', controller.findOne);

  /**
   * @swagger
   * /api/photos:
   *   post:
   *     summary: Sube uno o más archivos de imagen
   *     tags: [Photos]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               files:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *     responses:
   *       201:
   *         description: Fotos subidas
   *       400:
   *         description: No se recibió ningún archivo
   */
  router.post('/', uploadFile, controller.upload);

  /**
   * @swagger
   * /api/photos/cleanup-orphans:
   *   post:
   *     summary: Dispara manualmente la limpieza de fotos "pending" (subidas y nunca asociadas a un producto)
   *     description: >
   *       Borra de Cloudinary y de la base de datos las fotos que llevan más tiempo del configurado
   *       (ORPHAN_PHOTOS_MIN_AGE_MINUTES) sin quedar asociadas a ningún producto. El mismo trabajo
   *       corre automáticamente por cron; este endpoint es para forzarlo (operación/pruebas).
   *     tags: [Photos]
   *     responses:
   *       200:
   *         description: Resultado de la limpieza (escaneadas, borradas, fallidas)
   */
  router.post('/cleanup-orphans', controller.cleanupOrphans);

  /**
   * @swagger
   * /api/photos/{id}:
   *   delete:
   *     summary: Elimina una foto
   *     tags: [Photos]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       204:
   *         description: Foto eliminada
   *       404:
   *         description: Foto no encontrada
   */
  router.delete('/:id', controller.remove);

  return router;
};

export const buildLegacyFileRouter = (controller: PhotoController): Router => {
  const router = Router();

  /**
   * @swagger
   * /api/files/upload:
   *   post:
   *     summary: 'Alias legacy de POST /api/photos: sube uno o más archivos de imagen'
   *     tags: [Photos]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               files:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *     responses:
   *       201:
   *         description: Fotos subidas
   *       400:
   *         description: No se recibió ningún archivo
   */
  router.post('/upload', uploadFile, controller.upload);

  return router;
};
