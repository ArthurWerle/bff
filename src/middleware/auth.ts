import { Request, Response, NextFunction } from 'express';
import { IdentityService, AuthUser } from '../services/IdentityService';
import { authCache } from '../authCache';

export const SESSION_COOKIE = 'session_id';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const sessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.COOKIE_SECURE === 'true',
  maxAge: THIRTY_DAYS_MS,
  path: '/',
});

// Validates the session cookie against the identity service (with a short
// in-memory cache) and attaches the user to the request. Re-issues the
// cookie on success so its expiry slides along with the server session.
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const sessionId: string | undefined = req.cookies?.[SESSION_COOKIE];

  if (!sessionId) {
    res.status(401).json({
      error: { status: 401, message: 'Authentication required' },
    });
    return;
  }

  const cached = authCache.get(sessionId);
  if (cached) {
    req.user = cached;
    next();
    return;
  }

  try {
    const identity = new IdentityService();
    const response = await identity.post<AuthUser>(
      '/auth/validate',
      {},
      undefined,
      { headers: { 'X-Session-ID': sessionId } }
    );

    const user = response.data;
    authCache.set(sessionId, user);
    req.user = user;

    // Sliding cookie: keep the browser cookie alive as long as the session is
    res.cookie(SESSION_COOKIE, sessionId, sessionCookieOptions());
    next();
  } catch (error: any) {
    if (error?.response?.status === 401) {
      res.status(401).json({
        error: { status: 401, message: 'Invalid or expired session' },
      });
      return;
    }

    console.error('Failed to validate session with identity service:', error?.message);
    res.status(503).json({
      error: { status: 503, message: 'Authentication service unavailable' },
    });
  }
};
