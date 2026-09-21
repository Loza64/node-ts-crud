import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../../shared/errors/AppError';
import { buildPaginatedResponse } from '../../../../shared/pagination/paginate.util';
import { SearchQueryDto } from '../../../../shared/pagination/pagination-query.dto';
import { UploadFilesUseCase } from '../../application/upload-files.use-case';
import { FindAllPhotosUseCase } from '../../application/find-all-photos.use-case';
import { FindPhotoByIdUseCase } from '../../application/find-photo-by-id.use-case';
import { DeletePhotoUseCase } from '../../application/delete-photo.use-case';

export class PhotoController {
  constructor(
    private readonly uploadFilesUseCase: UploadFilesUseCase,
    private readonly findAllPhotosUseCase: FindAllPhotosUseCase,
    private readonly findPhotoByIdUseCase: FindPhotoByIdUseCase,
    private readonly deletePhotoUseCase: DeletePhotoUseCase,
  ) { }

  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];

      if (!files.length) {
        throw new AppError('No se recibió ningún archivo', 400);
      }

      const photos = await this.uploadFilesUseCase.execute(files);
      res.status(201).json({ data: photos.map((photo) => photo.toPublic()) });
    } catch (err) {
      next(err);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, pageSize, search } = req.validatedQuery as SearchQueryDto;
      const result = await this.findAllPhotosUseCase.execute({ page, pageSize, search });
      res.status(200).json(buildPaginatedResponse(result, (photo) => photo.toPublic()));
    } catch (err) {
      next(err);
    }
  };

  findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const photo = await this.findPhotoByIdUseCase.execute(id);
      res.status(200).json({ data: photo.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      await this.deletePhotoUseCase.execute(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
