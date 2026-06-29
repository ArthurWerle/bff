import { Router } from 'express';
import { mountTransactionRoutes } from './handlers/transaction';
import { mountCategoryRoutes } from './handlers/category';
import { mountTypeRoutes } from './handlers/type';
import { mountSubcategoryRoutes } from './handlers/subcategory';
import { mountLocationRoutes } from './handlers/location';

const router = Router();

mountTransactionRoutes(router);
mountCategoryRoutes(router);
mountTypeRoutes(router);
mountSubcategoryRoutes(router);
mountLocationRoutes(router);

export default router;
