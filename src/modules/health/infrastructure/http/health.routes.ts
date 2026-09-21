import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/health/hello:
 *   get:
 *     summary: Chequeo simple de que el server está vivo
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: El server responde
 */
router.get('/hello', (_req, res) => {
  res.status(200).json({ message: 'hello server' });
});

export default router;
