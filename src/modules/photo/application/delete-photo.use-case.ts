import { FileStorage } from '../../../shared/cloudinary/cloudinary.port';
import { AppError } from '../../../shared/errors/AppError';
import { errorLog } from '../../../shared/logger/logger';
import { PhotoRepository } from '../domain/photo.repository';

/**
 * Eliminacion PERMANENTE: borra el archivo en Cloudinary y la fila en la DB
 * (las asociaciones con productos se eliminan por CASCADE).
 */
export class DeletePhotoUseCase {
  constructor(
    private readonly photoRepository: PhotoRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(id: number): Promise<void> {
    const photo = await this.photoRepository.findByIdWithPublicId(id);
    if (!photo) {
      throw new AppError('Foto no encontrada', 404);
    }

    // Primero Cloudinary: si falla, la DB queda intacta y se puede reintentar.
    // Si el archivo ya no existe alli, Cloudinary responde "not found" sin error,
    // asi que un reintento tras un fallo parcial termina de borrar la fila.
    try {
      await this.fileStorage.destroy(photo.publicId, photo.resourceType);
    } catch (err) {
      errorLog('No se pudo eliminar la foto %s en Cloudinary: %O', id, err);
      throw new AppError('No se pudo eliminar el archivo en Cloudinary', 502);
    }

    await this.photoRepository.hardDelete(id);
  }
}
