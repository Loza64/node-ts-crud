import { FindOptionsWhere, In, Raw, Repository } from 'typeorm';
import { AppDataSource } from '../../../../shared/database/data-source';
import { paginateRepository } from '../../../../shared/pagination/paginate.util';
import { ListParams, Page } from '../../../../shared/pagination/pagination.types';
import { iLikeContains, toLikePattern } from '../../../../shared/pagination/search.util';
import { Photo } from '../../domain/photo.entity';
import { PhotoRepository } from '../../domain/photo.repository';

export class TypeOrmPhotoRepository implements PhotoRepository {
  private readonly repo: Repository<Photo> = AppDataSource.getRepository(Photo);

  findAll({ page, pageSize, search }: ListParams): Promise<Page<Photo>> {

    const where: FindOptionsWhere<Photo>[] = search
      ? [
        { originalFilename: iLikeContains(search) },
        {
          tags: Raw(
            (alias) => `EXISTS (SELECT 1 FROM unnest(${alias}) AS tag WHERE tag ILIKE :tagPattern)`,
            { tagPattern: toLikePattern(search) },
          ),
        },
      ]
      : [{}];

    return paginateRepository(this.repo, { page, pageSize }, { where, order: { id: 'DESC' } });
  }

  findById(id: number): Promise<Photo | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByIdWithPublicId(id: number): Promise<Photo | null> {
    return this.repo
      .createQueryBuilder('photo')
      .addSelect('photo.publicId')
      .where('photo.id = :id', { id })
      .getOne();
  }

  findByIds(ids: number[]): Promise<Photo[]> {
    if (!ids.length) return Promise.resolve([]);
    return this.repo.find({ where: { id: In(ids) } });
  }

  save(photo: Photo): Promise<Photo> {
    return this.repo.save(photo);
  }

  saveMany(photos: Photo[]): Promise<Photo[]> {
    return this.repo.save(photos);
  }

  async updateTags(id: number, tags: string[]): Promise<void> {
    await this.repo.update(id, { tags });
  }

  findOrphans(olderThan: Date): Promise<Photo[]> {
    return this.repo
      .createQueryBuilder('photo')
      .leftJoin('product_photos', 'pp', 'pp."photoId" = photo.id')
      .where('pp."photoId" IS NULL')
      .andWhere('photo.createdAt < :olderThan', { olderThan })
      .orderBy('photo.createdAt', 'ASC')
      .getMany();
  }

  async hardDelete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
