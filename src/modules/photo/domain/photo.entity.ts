import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/database/base.entity';

export interface PhotoEagerTransformation {
  url: string;
  secureUrl: string;
  width: number;
  height: number;
}

/**
 * Las fotos se eliminan de forma PERMANENTE (DB + Cloudinary), por eso esta
 * entidad extiende BaseEntity (sin deletedAt / soft delete).
 */
@Entity('photos')
export class Photo extends BaseEntity {
  @Column({ type: 'varchar' })
  url: string = '';

  @Column({ type: 'varchar', name: 'secure_url' })
  secureUrl: string = '';

  @Column({ type: 'varchar', name: 'resource_type' })
  resourceType: string = '';

  @Column({ type: 'varchar' })
  format: string = '';

  @Column({ type: 'varchar', name: 'original_filename' })
  originalFilename: string = '';

  @Column({ type: 'int' })
  width: number = 0;

  @Column({ type: 'int' })
  height: number = 0;

  // bigint: TypeORM/pg lo devuelve como string, igual que en el ejemplo
  @Column({ type: 'bigint' })
  bytes: string = '0';

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  tags: string[] = [];

  @Column({ type: 'jsonb', nullable: true })
  eager: PhotoEagerTransformation[] | null = null;

  // Necesario para poder borrar el archivo en Cloudinary; nunca se expone.
  @Column({ type: 'varchar', name: 'public_id', select: false })
  publicId: string = '';

  toPublic() {
    return {
      id: this.id,
      url: this.url,
      secureUrl: this.secureUrl,
      resourceType: this.resourceType,
      format: this.format,
      originalFilename: this.originalFilename,
      width: this.width,
      height: this.height,
      bytes: this.bytes,
      tags: this.tags,
      eager: this.eager,
    };
  }
}
