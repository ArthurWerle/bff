import { Router } from 'express';
import { mountAiRoutes } from './ai';
import { AiService } from '../services/AiService';

jest.mock('../services/AiService');

const mockedPost = AiService.prototype.post as jest.Mock;

// Recursively finds a mounted route handler, descending into nested routers
// (the AI routes live on a sub-router mounted at /ai).
const findHandler = (router: Router, method: string, path: string): any => {
  for (const layer of (router as any).stack) {
    if (layer.route?.path === path && layer.route?.methods[method]) {
      const handlers = layer.route.stack.map((s: any) => s.handle);
      return handlers[handlers.length - 1];
    }
    if (layer.name === 'router' && layer.handle?.stack) {
      const found = findHandler(layer.handle, method, path);
      if (found) return found;
    }
  }
  return undefined;
};

const buildRes = () => {
  const res: any = { statusCode: 0, body: undefined };
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((body: any) => {
    res.body = body;
    return res;
  });
  return res;
};

describe('ai handlers', () => {
  const router = Router();
  mountAiRoutes(router);

  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('scan forwards messages plus the authed user id and passes the reply through', async () => {
    mockedPost.mockResolvedValue({
      status: 200,
      data: { success: true, summary: 'Added R$ 10', transactions: [] },
    });

    const scan = findHandler(router, 'post', '/scan');
    const req: any = {
      body: { messages: [{ type: 'text', content: 'hi' }] },
      user: { id: 7 },
    };
    const res = buildRes();

    await scan(req, res);

    expect(mockedPost).toHaveBeenCalledWith('/scan', {
      messages: [{ type: 'text', content: 'hi' }],
      userId: '7',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      summary: 'Added R$ 10',
      transactions: [],
    });
  });

  it('scan passes an ai-internal 422 failure through untouched', async () => {
    mockedPost.mockRejectedValue({
      response: {
        status: 422,
        data: { success: false, error: 'no transactions found' },
      },
    });

    const scan = findHandler(router, 'post', '/scan');
    const res = buildRes();

    await scan({ body: { messages: [] }, user: { id: 7 } } as any, res);

    expect(res.statusCode).toBe(422);
    expect(res.body).toEqual({ success: false, error: 'no transactions found' });
  });

  it('scan wraps a transport failure (no response) as 502', async () => {
    mockedPost.mockRejectedValue(new Error('ECONNREFUSED'));

    const scan = findHandler(router, 'post', '/scan');
    const res = buildRes();

    await scan({ body: { messages: [] }, user: { id: 7 } } as any, res);

    expect(res.statusCode).toBe(502);
    expect(res.body.error).toBe('Failed to proxy request to POST /ai/scan');
  });

  it('ask forwards the prompt with the authed user id', async () => {
    mockedPost.mockResolvedValue({
      status: 200,
      data: { success: true, data: { answer: '42' } },
    });

    const ask = findHandler(router, 'post', '/ask');
    const req: any = { body: { prompt: 'how much did I spend?' }, user: { id: 3 } };
    const res = buildRes();

    await ask(req, res);

    expect(mockedPost).toHaveBeenCalledWith('/ask', {
      prompt: 'how much did I spend?',
      userId: '3',
    });
    expect(res.body).toEqual({ success: true, data: { answer: '42' } });
  });
});
