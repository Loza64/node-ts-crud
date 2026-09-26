import app from './app';
import { buildContainer } from './composition-root';
import { env } from './shared/config/env';
import { serverLog, errorLog, swaggerLog } from './shared/logger/logger';
import { AppDataSource } from './shared/database/data-source';
import { NodeCronScheduler } from './shared/scheduler/node-cron.scheduler';
import { createOrphanPhotosCleanupJob } from './modules/photo/infrastructure/scheduler/orphan-photos-cleanup.job';

const bootstrap = async (): Promise<void> => {
  await AppDataSource.initialize();
  serverLog('Data source initialized');

  const server = app.listen(env.PORT, () => {
    serverLog(`Running on http://localhost:${env.PORT}`);
    swaggerLog(`Available on http://localhost:${env.PORT}/api-docs`);
  });

  const { cleanupOrphanPhotosUseCase } = buildContainer();

  const scheduler = new NodeCronScheduler();
  scheduler.register(createOrphanPhotosCleanupJob(cleanupOrphanPhotosUseCase, env.ORPHAN_PHOTOS_CRON));
  scheduler.start();

  const shutdown = async (signal: string): Promise<void> => {
    serverLog('Recibida %s, cerrando de forma ordenada...', signal);
    scheduler.stop();
    server.close();
    await AppDataSource.destroy();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));  //Cerrar el deploy con  Ctrl + C
  process.on('SIGTERM', () => void shutdown('SIGTERM')); //Cuando docker cierra el deploy
};

bootstrap().catch((err) => {
  errorLog('Failed to start the server: %O', err);
  process.exit(1);
});
