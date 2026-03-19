import { Router } from 'express';
import { TransactionService } from '../services/TransactionService';

export function mountSubcategoryRoutes(router: Router) {
  router.get('/subcategories', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.get('/subcategories');
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to GET /subcategories',
        cause: error?.response?.data ?? error,
      });
    }
  });

  router.post('/subcategories', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.post('/subcategories', req.body);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to POST /subcategories',
        cause: error?.response?.data ?? error,
      });
    }
  });

  router.get('/subcategories/:id', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.get(`/subcategories/${req.params.id}`);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to GET /subcategories/:id',
        cause: error?.response?.data ?? error,
      });
    }
  });

  router.put('/subcategories/:id', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.put(
        `/subcategories/${req.params.id}`,
        req.body
      );
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to PUT /subcategories/:id',
        cause: error?.response?.data ?? error,
      });
    }
  });

  router.delete('/subcategories/:id', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.delete(
        `/subcategories/${req.params.id}`,
        req.body
      );
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to DELETE /subcategories/:id',
        cause: error?.response?.data ?? error,
      });
    }
  });
}
