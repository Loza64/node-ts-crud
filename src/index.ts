import app from './app';
import { buildContainer } from './composition-root';
import { env } from './shared/config/env';
import { serverLog, errorLog, swaggerLog } from './shared/logger/logger';
import { AppDataSource } from './shared/database/data-source';
import { registerOrphanPhotosCleanupJob } from './shared/scheduler/orphan-photos.scheduler';

const bootstrap = async (): Promise<void> => {
  await AppDataSource.initialize();
  serverLog('Data source initialized');

  const server = app.listen(env.PORT, () => {
    serverLog(`Running on http://localhost:${env.PORT}`);
    swaggerLog(`Available on http://localhost:${env.PORT}/api-docs`);
  });

  // Container independiente solo para lo que necesita correr fuera del ciclo request/response.
  const { cleanupOrphanPhotosUseCase } = buildContainer();
  const orphanPhotosJob = registerOrphanPhotosCleanupJob(cleanupOrphanPhotosUseCase);

  const shutdown = async (signal: string): Promise<void> => {
    serverLog('Recibida %s, cerrando de forma ordenada...', signal);
    orphanPhotosJob.stop();
    server.close();
    await AppDataSource.destroy();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

bootstrap().catch((err) => {
  errorLog('Failed to start the server: %O', err);
  process.exit(1);
});
