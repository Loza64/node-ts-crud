import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/database/base.entity';

export interface PhotoEagerTransformation {
  url: string;
  secureUrl: string;
  width: number;
  height: number;
}

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

  @Column({ type: 'bigint' })
  bytes: string = '0';

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  tags: string[] = [];

  @Column({ type: 'jsonb', nullable: true })
  eager: PhotoEagerTransformation[] | null = null;

  @Column({ type: 'varchar', name: 'public_id', select: false })
  publicId: string = '';

  /**
   * null  -> "pending": subida a Cloudinary pero aún no asociada a ningún producto.
   * Date  -> "attached": el momento en que quedó asociada por última vez.
   * Las fotos "pending" con más de cierta antigüedad son candidatas a limpieza automática.
   */
  @Column({ type: 'timestamptz', name: 'attached_at', nullable: true, default: null })
  attachedAt: Date | null = null;

  get isPending(): boolean {
    return this.attachedAt === null;
  }

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
