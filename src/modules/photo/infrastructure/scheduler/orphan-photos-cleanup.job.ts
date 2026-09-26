import { CronJob } from '../../../../shared/scheduler/scheduler.port';
import { CleanupOrphanPhotosUseCase } from '../../application/cleanup-orphan-photos.use-case';

export const ORPHAN_PHOTOS_CLEANUP_JOB_NAME = 'orphan-photos-cleanup';

export const createOrphanPhotosCleanupJob = (
  cleanupOrphanPhotosUseCase: CleanupOrphanPhotosUseCase,
  cronExpression: string,
): CronJob => ({
  name: ORPHAN_PHOTOS_CLEANUP_JOB_NAME,
  cronExpression,
  async run() {
    await cleanupOrphanPhotosUseCase.execute();
  },
});
