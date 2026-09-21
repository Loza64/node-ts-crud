import { Request, Response, NextFunction } from 'express';
import { CreateCategoryUseCase } from '../../application/create-category.use-case';
import { UpdateCategoryUseCase } from '../../application/update-category.use-case';
import { DeleteCategoryUseCase } from '../../application/delete-category.use-case';
import { RestoreCategoryUseCase } from '../../application/restore-category.use-case';
import { FindAllCategoriesUseCase } from '../../application/find-all-categories.use-case';
import { FindCategoryByIdUseCase } from '../../application/find-category-by-id.use-case';
import { SoftDeleteQueryDto } from '../../../../shared/pagination/pagination-query.dto';
import { buildPaginatedResponse } from '../../../../shared/pagination/paginate.util';

export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly restoreCategoryUseCase: RestoreCategoryUseCase,
    private readonly findAllCategoriesUseCase: FindAllCategoriesUseCase,
    private readonly findCategoryByIdUseCase: FindCategoryByIdUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.createCategoryUseCase.execute(req.body);
      res.status(201).json({ data: category.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const category = await this.updateCategoryUseCase.execute(id, req.body);
      res.status(200).json({ data: category.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      await this.deleteCategoryUseCase.execute(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const category = await this.restoreCategoryUseCase.execute(id);
      res.status(200).json({ data: category.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, pageSize, search, status } = req.validatedQuery as SoftDeleteQueryDto;
      const result = await this.findAllCategoriesUseCase.execute({ page, pageSize, search, status });
      res.status(200).json(buildPaginatedResponse(result, (category) => category.toPublic()));
    } catch (err) {
      next(err);
    }
  };

  findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const category = await this.findCategoryByIdUseCase.execute(id);
      res.status(200).json({ data: category.toPublic() });
    } catch (err) {
      next(err);
    }
  };
}
