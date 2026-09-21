import { AppError } from '../../../shared/errors/AppError';
import { Category } from '../../category/domain/category.entity';
import { CategoryRepository } from '../../category/domain/category.repository';
import { Photo } from '../../photo/domain/photo.entity';
import { PhotoRepository } from '../../photo/domain/photo.repository';

/**
 * Reglas de negocio compartidas por crear/actualizar producto sobre las
 * referencias que llegan como { id }:
 *  - la categoria debe existir y NO estar eliminada
 *  - todas las fotos deben existir
 */
export const findCategoryOrFail = async (
  categoryRepository: CategoryRepository,
  categoryId: number,
): Promise<Category> => {
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    throw new AppError(`La categoría con id ${categoryId} no existe`, 404);
  }
  return category;
};

export const findPhotosOrFail = async (
  photoRepository: PhotoRepository,
  photoIds: number[],
): Promise<Photo[]> => {
  const uniqueIds = [...new Set(photoIds)];
  if (!uniqueIds.length) return [];

  const photos = await photoRepository.findByIds(uniqueIds);
  if (photos.length !== uniqueIds.length) {
    const found = new Set(photos.map((photo) => photo.id));
    const missing = uniqueIds.filter((id) => !found.has(id));
    throw new AppError(`Fotos no encontradas: ${missing.join(', ')}`, 404);
  }
  return photos;
};
