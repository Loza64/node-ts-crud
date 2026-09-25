import { ListParams, Page } from '../../../shared/pagination/pagination.types';
import { Photo } from './photo.entity';

export interface PhotoRepository {
  findAll(params: ListParams): Promise<Page<Photo>>;
  findById(id: number): Promise<Photo | null>;

  findByIdWithPublicId(id: number): Promise<Photo | null>;
  findByIds(ids: number[]): Promise<Photo[]>;
  save(photo: Photo): Promise<Photo>;
  saveMany(photos: Photo[]): Promise<Photo[]>;
  updateTags(id: number, tags: string[]): Promise<void>;

  /** Marca las fotos dadas como "attached" (asociadas a un producto) con la marca de tiempo actual. */
  markAttached(ids: number[]): Promise<void>;

  /**
   * Fotos "pending" (nunca asociadas) creadas antes de `olderThan`.
   * Son las candidatas seguras para el job de limpieza de huérfanas.
   */
  findOrphans(olderThan: Date): Promise<Photo[]>;

  hardDelete(id: number): Promise<void>;
}
