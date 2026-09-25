import cron, { ScheduledTask } from 'node-cron';
import { env } from '../config/env';
import { errorLog, serverLog } from '../logger/logger';
import { CleanupOrphanPhotosUseCase } from '../../modules/photo/application/cleanup-orphan-photos.use-case';

/**
 * Registra (pero no arranca) el cron de limpieza de fotos huérfanas.
 * Se separa de `start()` para poder testear/inspeccionar el schedule sin
 * depender de un timer real, y para poder pararlo limpio en shutdown.
 */
export const registerOrphanPhotosCleanupJob = (
  cleanupOrphanPhotosUseCase: CleanupOrphanPhotosUseCase,
): ScheduledTask => {
  if (!cron.validate(env.ORPHAN_PHOTOS_CRON)) {
    throw new Error(`ORPHAN_PHOTOS_CRON inválido: "${env.ORPHAN_PHOTOS_CRON}"`);
  }

  let running = false;

  const task = cron.schedule(
    env.ORPHAN_PHOTOS_CRON,
    async () => {
      // Evita que dos corridas se pisen si una limpieza tarda más que el intervalo del cron.
      if (running) {
        serverLog('Limpieza de fotos huérfanas: corrida anterior aún en curso, se omite este tick');
        return;
      }
      running = true;
      try {
        await cleanupOrphanPhotosUseCase.execute();
      } catch (err) {
        errorLog('Fallo inesperado en el job de limpieza de fotos huérfanas: %O', err);
      } finally {
        running = false;
      }
    },
    { name: 'orphan-photos-cleanup' },
  );

  serverLog('Job de limpieza de fotos huérfanas registrado (cron: "%s")', env.ORPHAN_PHOTOS_CRON);

  return task;
};
