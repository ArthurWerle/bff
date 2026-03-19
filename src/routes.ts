import { Router } from 'express';
import { mountTransactionRoutes } from './handlers/transaction';
import { mountCategoryRoutes } from './handlers/category';
import { mountTypeRoutes } from './handlers/type';
import { mountSubcategoryRoutes } from './handlers/subcategory';

const router = Router();

mountTransactionRoutes(router);
mountCategoryRoutes(router);
mountTypeRoutes(router);
mountSubcategoryRoutes(router);

export default router;
