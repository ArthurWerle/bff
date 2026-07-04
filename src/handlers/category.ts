import { Router } from 'express';
import { TransactionService } from '../services/TransactionService';

export function mountCategoryRoutes(router: Router) {
  router.get('/monthly-expenses-by-category', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.get<{
        categories: { category_name: string; total: number }[];
      }>('/transactions/reports/monthly-expenses-by-category', {
        month: req.query.month,
        year: req.query.year,
      });

      // Adapt the ordered array to the Record shape the frontend consumes;
      // JS objects preserve insertion order, so the chart keeps its sorting.
      res
        .status(response.status)
        .json(
          Object.fromEntries(
            response.data.categories.map((c) => [c.category_name, c.total])
          )
        );
    } catch (error: any) {
      console.error(error);
      res.status(error?.response?.status || 500).json({
        error: 'Failed to fetch data /monthly-expenses-by-category',
        cause: error?.response?.data ?? error,
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
