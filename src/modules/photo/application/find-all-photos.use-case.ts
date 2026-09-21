import { ListParams, Page } from '../../../shared/pagination/pagination.types';
import { Photo } from '../domain/photo.entity';
import { PhotoRepository } from '../domain/photo.repository';

export class FindAllPhotosUseCase {
  constructor(private readonly photoRepository: PhotoRepository) {}

  execute(params: ListParams): Promise<Page<Photo>> {
    return this.photoRepository.findAll(params);
  }
}
