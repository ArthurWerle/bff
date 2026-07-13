import { Router } from 'express';
import { mountAiRoutes } from './ai';
import { AiService } from '../services/AiService';

jest.mock('../services/AiService');

const mockedPost = AiService.prototype.post as jest.Mock;
const mockedGet = AiService.prototype.get as jest.Mock;
const mockedPatch = AiService.prototype.patch as jest.Mock;
const mockedDelete = AiService.prototype.delete as jest.Mock;

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

const ownedChatPayload = (userId: string) => ({
  status: 200,
  data: {
    success: true,
    data: {
      chat: {
        id: 'chat-1',
        userId,
        title: 'Groceries',
        createdAt: '',
        updatedAt: '',
      },
      messages: [{ id: 'm1', role: 'user', content: 'hi', attachments: [] }],
    },
  },
});

describe('ai handlers', () => {
  const router = Router();
  mountAiRoutes(router);

  beforeEach(() => {
    mockedPost.mockReset();
    mockedGet.mockReset();
    mockedPatch.mockReset();
    mockedDelete.mockReset();
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

  it('scan ignores a client-supplied userId in favor of the session user', async () => {
    mockedPost.mockResolvedValue({ status: 200, data: { success: true } });

    const scan = findHandler(router, 'post', '/scan');
    const res = buildRes();

    await scan(
      { body: { messages: [], userId: '999' }, user: { id: 7 } } as any,
      res
    );

    expect(mockedPost).toHaveBeenCalledWith('/scan', {
      messages: [],
      userId: '7',
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
    expect(res.body).toEqual({
      success: false,
      error: 'no transactions found',
    });
  });

  it('scan wraps a transport failure (no response) as 502', async () => {
    mockedPost.mockRejectedValue(new Error('ECONNREFUSED'));

    const scan = findHandler(router, 'post', '/scan');
    const res = buildRes();

    await scan({ body: { messages: [] }, user: { id: 7 } } as any, res);

    expect(res.statusCode).toBe(502);
    expect(res.body.error).toBe('Failed to proxy request to POST /ai/scan');
  });

  describe('POST /ask', () => {
    it('forwards messages with the authed user id', async () => {
      mockedPost.mockResolvedValue({
        status: 200,
        data: { success: true, chatId: 'chat-1', answer: '42' },
      });

      const ask = findHandler(router, 'post', '/ask');
      const req: any = {
        body: {
          messages: [{ type: 'text', content: 'how much did I spend?' }],
        },
        user: { id: 3 },
      };
      const res = buildRes();

      await ask(req, res);

      expect(mockedGet).not.toHaveBeenCalled();
      expect(mockedPost).toHaveBeenCalledWith('/ask', {
        messages: [{ type: 'text', content: 'how much did I spend?' }],
        userId: '3',
      });
      expect(res.body).toEqual({
        success: true,
        chatId: 'chat-1',
        answer: '42',
      });
    });

    it('verifies chat ownership before forwarding when a chatId is given', async () => {
      mockedGet.mockResolvedValue(ownedChatPayload('3'));
      mockedPost.mockResolvedValue({
        status: 200,
        data: { success: true, chatId: 'chat-1', answer: 'sure' },
      });

      const ask = findHandler(router, 'post', '/ask');
      const req: any = {
        body: {
          messages: [{ type: 'text', content: 'more?' }],
          chatId: 'chat-1',
        },
        user: { id: 3 },
      };
      const res = buildRes();

      await ask(req, res);

      expect(mockedGet).toHaveBeenCalledWith('/chats/chat-1');
      expect(mockedPost).toHaveBeenCalledWith('/ask', {
        messages: [{ type: 'text', content: 'more?' }],
        chatId: 'chat-1',
        userId: '3',
      });
      expect(res.statusCode).toBe(200);
    });

    it('404s without calling /ask when the chat belongs to someone else', async () => {
      mockedGet.mockResolvedValue(ownedChatPayload('999'));

      const ask = findHandler(router, 'post', '/ask');
      const req: any = {
        body: {
          messages: [{ type: 'text', content: 'more?' }],
          chatId: 'chat-1',
        },
        user: { id: 3 },
      };
      const res = buildRes();

      await ask(req, res);

      expect(mockedPost).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ success: false, error: 'Chat not found' });
    });
  });

  describe('GET /chats', () => {
    it('always scopes the list to the session user', async () => {
      mockedGet.mockResolvedValue({
        status: 200,
        data: { success: true, data: [{ id: 'chat-1' }] },
      });

      const list = findHandler(router, 'get', '/chats');
      const req: any = {
        query: { limit: '10', offset: '0', userId: '999' },
        user: { id: 3 },
      };
      const res = buildRes();

      await list(req, res);

      expect(mockedGet).toHaveBeenCalledWith('/chats', {
        userId: '3',
        limit: '10',
        offset: '0',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ success: true, data: [{ id: 'chat-1' }] });
    });
  });

  describe('GET /chats/:id', () => {
    it('returns the chat with messages when owned by the session user', async () => {
      mockedGet.mockResolvedValue(ownedChatPayload('3'));

      const get = findHandler(router, 'get', '/chats/:id');
      const res = buildRes();

      await get({ params: { id: 'chat-1' }, user: { id: 3 } } as any, res);

      expect(mockedGet).toHaveBeenCalledWith('/chats/chat-1');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.chat.id).toBe('chat-1');
      expect(res.body.data.messages).toHaveLength(1);
    });

    it('404s when the chat belongs to another user', async () => {
      mockedGet.mockResolvedValue(ownedChatPayload('999'));

      const get = findHandler(router, 'get', '/chats/:id');
      const res = buildRes();

      await get({ params: { id: 'chat-1' }, user: { id: 3 } } as any, res);

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ success: false, error: 'Chat not found' });
    });

    it('404s when the chat has no owner (legacy row)', async () => {
      mockedGet.mockResolvedValue(ownedChatPayload(null as any));

      const get = findHandler(router, 'get', '/chats/:id');
      const res = buildRes();

      await get({ params: { id: 'chat-1' }, user: { id: 3 } } as any, res);

      expect(res.statusCode).toBe(404);
    });

    it('404s when upstream does not know the chat', async () => {
      mockedGet.mockRejectedValue({
        response: {
          status: 404,
          data: { success: false, error: 'Chat not found' },
        },
      });

      const get = findHandler(router, 'get', '/chats/:id');
      const res = buildRes();

      await get({ params: { id: 'nope' }, user: { id: 3 } } as any, res);

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ success: false, error: 'Chat not found' });
    });

    it('wraps a transport failure as 502', async () => {
      mockedGet.mockRejectedValue(new Error('ECONNREFUSED'));

      const get = findHandler(router, 'get', '/chats/:id');
      const res = buildRes();

      await get({ params: { id: 'chat-1' }, user: { id: 3 } } as any, res);

      expect(res.statusCode).toBe(502);
      expect(res.body.error).toBe(
        'Failed to proxy request to GET /ai/chats/:id'
      );
    });
  });

  describe('PATCH /chats/:id', () => {
    it('renames an owned chat', async () => {
      mockedGet.mockResolvedValue(ownedChatPayload('3'));
      mockedPatch.mockResolvedValue({
        status: 200,
        data: { success: true, data: { id: 'chat-1', title: 'New title' } },
      });

      const patch = findHandler(router, 'patch', '/chats/:id');
      const res = buildRes();

      await patch(
        {
          params: { id: 'chat-1' },
          body: { title: 'New title' },
          user: { id: 3 },
        } as any,
        res
      );

      expect(mockedPatch).toHaveBeenCalledWith('/chats/chat-1', {
        title: 'New title',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('New title');
    });

    it('never calls upstream PATCH for a foreign chat', async () => {
      mockedGet.mockResolvedValue(ownedChatPayload('999'));

      const patch = findHandler(router, 'patch', '/chats/:id');
      const res = buildRes();

      await patch(
        {
          params: { id: 'chat-1' },
          body: { title: 'Hijack' },
          user: { id: 3 },
        } as any,
        res
      );

      expect(mockedPatch).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /chats/:id', () => {
    it('deletes an owned chat', async () => {
      mockedGet.mockResolvedValue(ownedChatPayload('3'));
      mockedDelete.mockResolvedValue({
        status: 200,
        data: { success: true, data: { deleted: true } },
      });

      const del = findHandler(router, 'delete', '/chats/:id');
      const res = buildRes();

      await del({ params: { id: 'chat-1' }, user: { id: 3 } } as any, res);

      expect(mockedDelete).toHaveBeenCalledWith('/chats/chat-1');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ success: true, data: { deleted: true } });
    });

    it('never calls upstream DELETE for a foreign chat', async () => {
      mockedGet.mockResolvedValue(ownedChatPayload('999'));

      const del = findHandler(router, 'delete', '/chats/:id');
      const res = buildRes();

      await del({ params: { id: 'chat-1' }, user: { id: 3 } } as any, res);

      expect(mockedDelete).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(404);
    });
  });
});
