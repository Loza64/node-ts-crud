/// <reference types="jest" />

import { FileStorage } from '../../../shared/cloudinary/cloudinary.port';
import { Photo } from '../domain/photo.entity';
import { PhotoRepository } from '../domain/photo.repository';
import { DeletePhotoUseCase } from './delete-photo.use-case';

describe('DeletePhotoUseCase (permanent delete)', () => {
  const photoRepository = {
    findByIdWithPublicId: jest.fn(),
    hardDelete: jest.fn(),
  } as unknown as jest.Mocked<PhotoRepository>;
  const fileStorage = { destroy: jest.fn() } as unknown as jest.Mocked<FileStorage>;
  const useCase = new DeletePhotoUseCase(photoRepository, fileStorage);

  const photo = Object.assign(new Photo(), { id: 8, publicId: 'uploads/abc', resourceType: 'image' });

  beforeEach(() => jest.resetAllMocks());

  it('404 when the photo does not exist', async () => {
    photoRepository.findByIdWithPublicId.mockResolvedValue(null);

    await expect(useCase.execute(8)).rejects.toMatchObject({ statusCode: 404 });
    expect(fileStorage.destroy).not.toHaveBeenCalled();
  });

  it('deletes the asset in Cloudinary and then the row in the database', async () => {
    photoRepository.findByIdWithPublicId.mockResolvedValue(photo);
    fileStorage.destroy.mockResolvedValue();

    await useCase.execute(8);

    expect(fileStorage.destroy).toHaveBeenCalledWith('uploads/abc', 'image');
    expect(photoRepository.hardDelete).toHaveBeenCalledWith(8);
  });

  it('keeps the row (502) when Cloudinary fails, so the delete can be retried', async () => {
    photoRepository.findByIdWithPublicId.mockResolvedValue(photo);
    fileStorage.destroy.mockRejectedValue(new Error('network'));

    await expect(useCase.execute(8)).rejects.toMatchObject({ statusCode: 502 });
    expect(photoRepository.hardDelete).not.toHaveBeenCalled();
  });
});
