import { Router } from 'express';
import { TransactionService } from '../services/TransactionService';

export function mountLocationRoutes(router: Router) {
  router.get('/locations', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.get('/locations');
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to GET /locations',
        cause: error?.response?.data ?? error,
      });
    }
  });

  router.post('/locations', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.post('/locations', req.body);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to POST /locations',
        cause: error?.response?.data ?? error,
      });
    }
  });

  router.post('/locations/merge', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.post('/locations/merge', req.body);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to POST /locations/merge',
        cause: error?.response?.data ?? error,
      });
    }
  });

  router.get('/locations/:id', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.get(`/locations/${req.params.id}`);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to GET /locations/:id',
        cause: error?.response?.data ?? error,
      });
    }
  });

  router.put('/locations/:id', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.put(
        `/locations/${req.params.id}`,
        req.body
      );
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to PUT /locations/:id',
        cause: error?.response?.data ?? error,
      });
    }
  });

  router.delete('/locations/:id', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.delete(
        `/locations/${req.params.id}`,
        req.body
      );
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to DELETE /locations/:id',
        cause: error?.response?.data ?? error,
      });
    }
  });
}
