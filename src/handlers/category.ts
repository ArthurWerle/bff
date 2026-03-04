import { Router } from 'express';
import { TransactionService } from '../services/TransactionService';

export function mountCategoryRoutes(router: Router) {
  router.get('/monthly-expenses-by-category', async (req, res) => {
    try {
      const service = new TransactionService();
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const result = await service.getMonthlyExpensesByCategory(month, year);

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: 'Failed to fetch data /total-values-by-category',
        cause: error,
      });
    }
  });

  router.get('/categories', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.get('/categories');
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to GET /categories',
        cause: error?.response?.data ?? error,
      });
    }
  });

  router.post('/categories', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.post('/categories', req.body);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to POST /categories',
        cause: error?.response?.data ?? error,
      });
    }
  });

  router.delete('/categories/:id', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.delete(
        `/categories/${req.params.id}`,
        req.body
      );
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to DELETE /categories/:id',
        cause: error?.response?.data ?? error,
      });
    }
  });

  router.put('/categories/:id', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.put(
        `/categories/${req.params.id}`,
        req.body
      );
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to PUT /categories/:id',
        cause: error?.response?.data ?? error,
      });
    }
  });
}
