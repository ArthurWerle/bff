import { Router } from 'express';
import { AiService } from '../services/AiService';

// Proxies the financer chat widget to the ai-internal service. Mounted behind
// the auth middleware, so the logged-in user's id is forwarded for tracing.
export function mountAiRoutes(router: Router) {
  const aiRouter = Router();

  // Receipt/audio scanning: extracts and creates transactions from an image
  // or audio attachment. ai-internal answers 422 with { success:false, error }
  // when nothing is extractable — a normal outcome, not a proxy failure — so
  // its response is forwarded untouched (status + body) below.
  aiRouter.post('/scan', async (req, res) => {
    try {
      const service = new AiService();
      const response = await service.post('/scan', {
        ...req.body,
        userId: req.body?.userId ?? String(req.user!.id),
      });

      res.status(response.status).json(response.data);
    } catch (error: any) {
      forwardError(res, error, 'POST /ai/scan');
    }
  });

  // General finance Q&A: stateless single prompt -> answer.
  aiRouter.post('/ask', async (req, res) => {
    try {
      const service = new AiService();
      const response = await service.post('/ask', {
        ...req.body,
        userId: req.body?.userId ?? String(req.user!.id),
      });

      res.status(response.status).json(response.data);
    } catch (error: any) {
      forwardError(res, error, 'POST /ai/ask');
    }
  });

  router.use('/ai', aiRouter);
}

// When ai-internal responds with an error status (e.g. 422), pass its body
// through unchanged so the client sees the real shape. Only genuine transport
// failures (no response) get wrapped as a 502.
function forwardError(res: any, error: any, label: string) {
  if (error?.response) {
    res.status(error.response.status).json(error.response.data);
    return;
  }

  console.error(`Failed to proxy request to ${label}:`, error?.message ?? error);
  res.status(502).json({
    error: `Failed to proxy request to ${label}`,
    cause: error?.message ?? 'Unknown error',
  });
}
