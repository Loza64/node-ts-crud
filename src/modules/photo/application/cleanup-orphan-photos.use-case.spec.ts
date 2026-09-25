/// <reference types="jest" />

import { AppError } from '../../../shared/errors/AppError';
import { Photo } from '../domain/photo.entity';
import { PhotoRepository } from '../domain/photo.repository';
import { DeletePhotoUseCase } from './delete-photo.use-case';
import { CleanupOrphanPhotosUseCase } from './cleanup-orphan-photos.use-case';

describe('CleanupOrphanPhotosUseCase', () => {
  const photoRepository = {
    findOrphans: jest.fn(),
  } as unknown as jest.Mocked<PhotoRepository>;

  const deletePhotoUseCase = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<DeletePhotoUseCase>;

  const useCase = new CleanupOrphanPhotosUseCase(photoRepository, deletePhotoUseCase, 60);

  const makePhoto = (id: number) => Object.assign(new Photo(), { id });

  beforeEach(() => jest.resetAllMocks());

  it('does nothing when there are no orphans', async () => {
    photoRepository.findOrphans.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual({ scanned: 0, deleted: 0, failed: [] });
    expect(deletePhotoUseCase.execute).not.toHaveBeenCalled();
  });

  it('only asks the repository for photos older than the grace period', async () => {
    photoRepository.findOrphans.mockResolvedValue([]);
    const before = Date.now();

    await useCase.execute();

    const [olderThan]: [Date] = photoRepository.findOrphans.mock.calls[0];
    const ageMs = before - olderThan.getTime();
    // ~60 minutes of grace period, with a little slack for test execution time.
    expect(ageMs).toBeGreaterThanOrEqual(60 * 60_000 - 1000);
    expect(ageMs).toBeLessThanOrEqual(60 * 60_000 + 5000);
  });

  it('deletes every orphan found and reports the count', async () => {
    photoRepository.findOrphans.mockResolvedValue([makePhoto(1), makePhoto(2), makePhoto(3)]);
    deletePhotoUseCase.execute.mockResolvedValue();

    const result = await useCase.execute();

    expect(deletePhotoUseCase.execute).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ scanned: 3, deleted: 3, failed: [] });
  });

  it('keeps going and reports partial failures instead of throwing', async () => {
    photoRepository.findOrphans.mockResolvedValue([makePhoto(1), makePhoto(2)]);
    deletePhotoUseCase.execute
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new AppError('No se pudo eliminar el archivo en Cloudinary', 502));

    const result = await useCase.execute();

    expect(result.scanned).toBe(2);
    expect(result.deleted).toBe(1);
    expect(result.failed).toEqual([
      { photoId: 2, reason: 'No se pudo eliminar el archivo en Cloudinary' },
    ]);
  });
});
