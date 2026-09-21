import { AppError } from '../../../shared/errors/AppError';
import { Photo } from '../domain/photo.entity';
import { PhotoRepository } from '../domain/photo.repository';

export class FindPhotoByIdUseCase {
  constructor(private readonly photoRepository: PhotoRepository) {}

  async execute(id: number): Promise<Photo> {
    const photo = await this.photoRepository.findById(id);
    if (!photo) {
      throw new AppError('Foto no encontrada', 404);
    }
    return photo;
  }
}
