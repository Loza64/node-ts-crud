/// <reference types="jest" />

import { CleanupOrphanPhotosUseCase } from '../../application/cleanup-orphan-photos.use-case';
import { createOrphanPhotosCleanupJob, ORPHAN_PHOTOS_CLEANUP_JOB_NAME } from './orphan-photos-cleanup.job';

describe('createOrphanPhotosCleanupJob', () => {
  const cleanupOrphanPhotosUseCase = {
    execute: jest.fn().mockResolvedValue({ scanned: 0, deleted: 0, failed: [] }),
  } as unknown as jest.Mocked<CleanupOrphanPhotosUseCase>;

  it('exposes the given cron expression under a stable job name', () => {
    const job = createOrphanPhotosCleanupJob(cleanupOrphanPhotosUseCase, '0 * * * *');

    expect(job.name).toBe(ORPHAN_PHOTOS_CLEANUP_JOB_NAME);
    expect(job.cronExpression).toBe('0 * * * *');
  });

  it('delegates each run to the use case', async () => {
    const job = createOrphanPhotosCleanupJob(cleanupOrphanPhotosUseCase, '0 * * * *');

    await job.run();

    expect(cleanupOrphanPhotosUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
