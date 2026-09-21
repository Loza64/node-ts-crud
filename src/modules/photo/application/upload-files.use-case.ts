import { FileStorage } from '../../../shared/cloudinary/cloudinary.port';
import { Photo } from '../domain/photo.entity';
import { PhotoRepository } from '../domain/photo.repository';

export class UploadFilesUseCase {
  constructor(
    private readonly fileStorage: FileStorage,
    private readonly photoRepository: PhotoRepository,
    private readonly folder: string,
  ) {}

  async execute(files: Express.Multer.File[]): Promise<Photo[]> {
    const uploads = await Promise.all(files.map((file) => this.fileStorage.upload(file, this.folder)));

    const photos = uploads.map((result) => {
      const photo = new Photo();
      photo.url = result.url;
      photo.secureUrl = result.secureUrl;
      photo.resourceType = result.resourceType;
      photo.format = result.format;
      photo.originalFilename = result.originalFilename;
      photo.width = result.width;
      photo.height = result.height;
      photo.bytes = String(result.bytes);
      photo.tags = result.tags;
      photo.eager = result.eager;
      photo.publicId = result.publicId;
      return photo;
    });

    return this.photoRepository.saveMany(photos);
  }
}
