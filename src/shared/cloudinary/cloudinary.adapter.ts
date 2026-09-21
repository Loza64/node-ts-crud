import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { cloudinary } from './cloudinary.config';
import { CloudinaryUploadResult, FileStorage } from './cloudinary.port';

export class CloudinaryFileStorage implements FileStorage {
  upload(file: Express.Multer.File, folder: string): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          tags: ['general'],
          eager: [{ width: 400, height: 400, crop: 'fill', gravity: 'auto' }],
        },
        (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }

          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            resourceType: result.resource_type,
            format: result.format,
            originalFilename: result.original_filename ?? file.originalname,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            tags: result.tags ?? [],
            eager: (result.eager ?? []).map((e: NonNullable<UploadApiResponse['eager']>[number]) => ({
              url: e.url,
              secureUrl: e.secure_url,
              width: e.width,
              height: e.height,
            })),
          });
        },
      );

      stream.end(file.buffer);
    });
  }

  async destroy(publicId: string, resourceType = 'image'): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }

  async setTags(publicId: string, tags: string[], resourceType = 'image'): Promise<void> {
    if (tags.length) {
      // Admin API: reemplaza los tags actuales por los indicados.
      await cloudinary.api.update(publicId, { tags, resource_type: resourceType });
    } else {
      // api.update ignora una lista vacia, asi que para "quitar todos" hay que usar esta llamada.
      await cloudinary.uploader.remove_all_tags([publicId], { resource_type: resourceType });
    }
  }
}
