export interface CloudinaryEagerTransformation {
  url: string;
  secureUrl: string;
  width: number;
  height: number;
}

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  originalFilename: string;
  width: number;
  height: number;
  bytes: number;
  tags: string[];
  eager: CloudinaryEagerTransformation[];
}

/**
 * Puerto de salida para almacenamiento de archivos. La implementacion
 * concreta (Cloudinary, S3, etc.) vive en la capa de infraestructura.
 */
export interface FileStorage {
  upload(file: Express.Multer.File, folder: string): Promise<CloudinaryUploadResult>;
  destroy(publicId: string, resourceType?: string): Promise<void>;
  /** REEMPLAZA los tags del asset ([] los quita todos). */
  setTags(publicId: string, tags: string[], resourceType?: string): Promise<void>;
}
