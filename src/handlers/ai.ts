import { Router } from 'express';
import { AiService } from '../services/AiService';

type Chat = {
  id: string;
  userId: string | null;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

type ChatWithMessages = {
  chat: Chat;
  messages: unknown[];
};

// Fetches a chat from ai-internal and verifies it belongs to the session
// user. Returns the { chat, messages } payload, or null when the chat does
// not exist OR belongs to someone else — both look like a 404 to the client
// so foreign chat ids don't leak their existence. Chats without a userId
// (legacy rows) are treated as not owned.
async function getOwnedChat(
  service: AiService,
  chatId: string,
  userId: string
): Promise<ChatWithMessages | null> {
  try {
    const response = await service.get<{
      success: boolean;
      data: ChatWithMessages;
    }>(`/chats/${encodeURIComponent(chatId)}`);
    const payload = response.data?.data;
    if (!payload?.chat || payload.chat.userId !== userId) {
      return null;
    }
    return payload;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

const notFound = (res: any) =>
  res.status(404).json({ success: false, error: 'Chat not found' });

// Proxies the financer chat widget and chat page to the ai-internal service.
// Mounted behind the auth middleware; ai-internal itself has no auth, so the
// session user id is enforced here on every route.
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
        userId: String(req.user!.id),
      });

      res.status(response.status).json(response.data);
    } catch (error: any) {
      forwardError(res, error, 'POST /ai/scan');
    }
  });

  // Conversational Q&A. ai-internal persists both sides of the exchange in a
  // chat: without a chatId it creates one (and auto-titles it), with a chatId
  // it appends to that conversation — so ownership is checked first.
  aiRouter.post('/ask', async (req, res) => {
    try {
      const service = new AiService();
      const userId = String(req.user!.id);

      if (req.body?.chatId) {
        const owned = await getOwnedChat(
          service,
          String(req.body.chatId),
          userId
        );
        if (!owned) {
          notFound(res);
          return;
        }
      }

      const response = await service.post('/ask', {
        ...req.body,
        userId,
      });

      res.status(response.status).json(response.data);
    } catch (error: any) {
      forwardError(res, error, 'POST /ai/ask');
    }
  });

  // Lists the session user's chats, newest activity first.
  aiRouter.get('/chats', async (req, res) => {
    try {
      const service = new AiService();
      const response = await service.get('/chats', {
        userId: String(req.user!.id),
        limit: req.query.limit,
        offset: req.query.offset,
      });

      res.status(response.status).json(response.data);
    } catch (error: any) {
      forwardError(res, error, 'GET /ai/chats');
    }
  });

  // A chat with its full message history. The ownership fetch doubles as the
  // response payload, so this is a single upstream call.
  aiRouter.get('/chats/:id', async (req, res) => {
    try {
      const service = new AiService();
      const owned = await getOwnedChat(
        service,
        req.params.id,
        String(req.user!.id)
      );
      if (!owned) {
        notFound(res);
        return;
      }

      res.status(200).json({ success: true, data: owned });
    } catch (error: any) {
      forwardError(res, error, 'GET /ai/chats/:id');
    }
  });

  // Renames a chat.
  aiRouter.patch('/chats/:id', async (req, res) => {
    try {
      const service = new AiService();
      const owned = await getOwnedChat(
        service,
        req.params.id,
        String(req.user!.id)
      );
      if (!owned) {
        notFound(res);
        return;
      }

      const response = await service.patch(
        `/chats/${encodeURIComponent(req.params.id)}`,
        { title: req.body?.title }
      );

      res.status(response.status).json(response.data);
    } catch (error: any) {
      forwardError(res, error, 'PATCH /ai/chats/:id');
    }
  });

  // Deletes (soft) a chat.
  aiRouter.delete('/chats/:id', async (req, res) => {
    try {
      const service = new AiService();
      const owned = await getOwnedChat(
        service,
        req.params.id,
        String(req.user!.id)
      );
      if (!owned) {
        notFound(res);
        return;
      }

      const response = await service.delete(
        `/chats/${encodeURIComponent(req.params.id)}`
      );

      res.status(response.status).json(response.data);
    } catch (error: any) {
      forwardError(res, error, 'DELETE /ai/chats/:id');
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

  console.error(
    `Failed to proxy request to ${label}:`,
    error?.message ?? error
  );
  res.status(502).json({
    error: `Failed to proxy request to ${label}`,
    cause: error?.message ?? 'Unknown error',
  });
}
