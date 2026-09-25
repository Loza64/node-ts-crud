import { errorLog, serverLog } from '../../../shared/logger/logger';
import { PhotoRepository } from '../domain/photo.repository';
import { DeletePhotoUseCase } from './delete-photo.use-case';

export interface CleanupOrphanPhotosResult {
  scanned: number;
  deleted: number;
  failed: Array<{ photoId: number; reason: string }>;
}

export class CleanupOrphanPhotosUseCase {
  constructor(
    private readonly photoRepository: PhotoRepository,
    private readonly deletePhotoUseCase: DeletePhotoUseCase,
    private readonly minPendingAgeMinutes: number,
  ) {}

  async execute(): Promise<CleanupOrphanPhotosResult> {
    const olderThan = new Date(Date.now() - this.minPendingAgeMinutes * 60_000);
    const orphans = await this.photoRepository.findOrphans(olderThan);

    if (!orphans.length) {
      return { scanned: 0, deleted: 0, failed: [] };
    }

    const results = await Promise.allSettled(
      orphans.map((photo) => this.deletePhotoUseCase.execute(photo.id)),
    );

    const failed: CleanupOrphanPhotosResult['failed'] = [];
    let deleted = 0;

    results.forEach((result, index) => {
      const photoId = orphans[index].id;
      if (result.status === 'fulfilled') {
        deleted += 1;
        return;
      }
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
      failed.push({ photoId, reason });
      errorLog('No se pudo limpiar la foto huérfana %s: %s', photoId, reason);
    });

    serverLog('Limpieza de fotos huérfanas: %d escaneadas, %d borradas, %d fallidas', orphans.length, deleted, failed.length);

    return { scanned: orphans.length, deleted, failed };
  }
}
