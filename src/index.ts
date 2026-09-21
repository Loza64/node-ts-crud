import app from './app';
import { env } from './shared/config/env';
import { serverLog, errorLog, swaggerLog } from './shared/logger/logger';
import { AppDataSource } from './shared/database/data-source';

const bootstrap = async (): Promise<void> => {
  await AppDataSource.initialize();
  serverLog('Data source initialized');
  app.listen(env.PORT, () => {
    serverLog(`Running on http://localhost:${env.PORT}`);
    swaggerLog(`Available on http://localhost:${env.PORT}/api-docs`)
  })
};

bootstrap().catch((err) => {
  errorLog('Failed to start the server: %O', err);
  process.exit(1);
});
