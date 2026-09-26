import { Request, Response, NextFunction } from 'express';
import { CreateProductUseCase } from '../../application/create-product.use-case';
import { UpdateProductUseCase } from '../../application/update-product.use-case';
import { DeleteProductUseCase } from '../../application/delete-product.use-case';
import { RestoreProductUseCase } from '../../application/restore-product.use-case';
import { FindAllProductsUseCase } from '../../application/find-all-products.use-case';
import { FindProductByIdUseCase } from '../../application/find-product-by-id.use-case';
import { ProductQueryDto } from '../../application/product-query.dto';
import { buildPaginatedResponse } from '../../../../shared/pagination/paginate.util';

export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly restoreProductUseCase: RestoreProductUseCase,
    private readonly findAllProductsUseCase: FindAllProductsUseCase,
    private readonly findProductByIdUseCase: FindProductByIdUseCase,
  ) { }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.createProductUseCase.execute(req.body);
      res.status(201).json({ data: product.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const product = await this.updateProductUseCase.execute(id, req.body);
      res.status(200).json({ data: product.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      await this.deleteProductUseCase.execute(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const product = await this.restoreProductUseCase.execute(id);
      res.status(200).json({ data: product.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, pageSize, search, deleted, category } =
        req.validatedQuery as ProductQueryDto;
      const result = await this.findAllProductsUseCase.execute({
        page,
        pageSize,
        search,
        deleted,
        categoryId: category,
      });
      res.status(200).json(buildPaginatedResponse(result, (product) => product.toPublic()));
    } catch (err) {
      next(err);
    }
  };

  findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const product = await this.findProductByIdUseCase.execute(id);
      res.status(200).json({ data: product.toPublic() });
    } catch (err) {
      next(err);
    }
  };
}
