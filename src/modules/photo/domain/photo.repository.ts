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

  findOrphans(olderThan: Date): Promise<Photo[]>;

  hardDelete(id: number): Promise<void>;
}
