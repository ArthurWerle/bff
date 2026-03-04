import { Router } from 'express';
import { TransactionService } from '../services/TransactionService';

export function mountTransactionRoutes(router: Router) {
  const transactionsRouter = Router();

  transactionsRouter.get('/', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.get('/transactions', req.query);

      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to call transactions v2',
        cause: error?.response?.data ?? error,
      });
    }
  });

  transactionsRouter.post('/', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.post('/transactions', req.body);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to POST /transactions',
        cause: error?.response?.data ?? error,
      });
    }
  });

  transactionsRouter.get('/average/by-category', async (req, res) => {
    try {
      const service = new TransactionService();
      const result: any = await service.get(
        '/transactions/average/by-category',
        req.query
      );

      res.status(result.status).json(result.data);
    } catch (error: any) {
      const status = error?.response?.status || 502;
      const cause = error?.response?.data ?? error?.message ?? 'Unknown error';
      console.error(
        'Failed to proxy request to GET /transactions/average/by-category:',
        cause
      );
      res.status(status).json({
        error: 'Failed to proxy request to GET /transactions/average/by-category',
        cause,
      });
    }
  });

  transactionsRouter.get('/latest', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.get('/transactions/latest', req.query);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to GET /transactions/latest',
        cause: error?.response?.data ?? error,
      });
    }
  });

  transactionsRouter.get('/biggest', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.get('/transactions/biggest', req.query);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to GET /transactions/biggest',
        cause: error?.response?.data ?? error,
      });
    }
  });

  transactionsRouter.patch('/:id/end', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.patch(
        `/transactions/${req.params.id}/end`,
        req.body
      );

      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.response?.status || 500).json({
        error: 'Failed to proxy request to PATCH /transactions/:id/end',
        cause: error?.response?.data ?? error,
      });
    }
  });

  transactionsRouter.get('/:id', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.get(`/transactions/${req.params.id}`);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to GET /transactions/:id',
        cause: error?.response?.data ?? error,
      });
    }
  });

  transactionsRouter.put('/:id', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.put(
        `/transactions/${req.params.id}`,
        req.body
      );
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to POST /transactions/:id',
        cause: error?.response?.data ?? error,
      });
    }
  });

  transactionsRouter.delete('/:id', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.delete(
        `/transactions/${req.params.id}`,
        req.body
      );

      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to /transactions/:id',
        cause: error?.response?.data ?? error,
      });
    }
  });

  transactionsRouter.post('/:id/prepay', async (req, res) => {
    try {
      const service = new TransactionService();
      const response = await service.post(
        `/transactions/${req.params.id}/prepay`,
        req.body
      );

      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(error);
      res.status(error?.status || 500).json({
        error: 'Failed to proxy request to POST /transactions/:id/prepay',
        cause: error?.response?.data ?? error,
      });
    }
  });

  router.use('/transactions', transactionsRouter);

  router.get('/overview/by-month', async (req, res) => {
    try {
      const service = new TransactionService();
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const response = await service.overviewByMonth(month, year);
      res.json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: 'Failed to fetch data /overview/by-month',
        cause: error,
      });
    }
  });

  router.get('/expense-comparsion-history', async (req, res) => {
    try {
      const service = new TransactionService();
      const monthlyData = await service.getIncomeAndExpenseComparisonHistory();

      res.json(monthlyData.reverse());
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: 'Failed to fetch data /expense-comparsion-history',
        cause: error,
      });
    }
  });
}
