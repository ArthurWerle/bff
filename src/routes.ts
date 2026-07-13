import { Router } from 'express';
import { mountTransactionRoutes } from './handlers/transaction';
import { mountCategoryRoutes } from './handlers/category';
import { mountTypeRoutes } from './handlers/type';
import { mountSubcategoryRoutes } from './handlers/subcategory';
import { mountLocationRoutes } from './handlers/location';
import { mountAuthRoutes } from './handlers/auth';
import { mountFeatureFlagRoutes } from './handlers/featureFlags';
import { mountAiRoutes } from './handlers/ai';
import { authMiddleware } from './middleware/auth';

const router = Router();

// Auth routes first: login/logout must work without a session
mountAuthRoutes(router);

// Everything below requires a valid session cookie
router.use(authMiddleware);

mountTransactionRoutes(router);
mountCategoryRoutes(router);
mountTypeRoutes(router);
mountSubcategoryRoutes(router);
mountLocationRoutes(router);
mountFeatureFlagRoutes(router);
mountAiRoutes(router);

export default router;
