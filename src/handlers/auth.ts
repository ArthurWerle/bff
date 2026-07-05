import { Router } from 'express';
import { IdentityService, AuthUser } from '../services/IdentityService';
import { authCache } from '../authCache';
import {
  authMiddleware,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '../middleware/auth';

interface LoginResponse {
  user: AuthUser;
  session_id: string;
  message: string;
}

export function mountAuthRoutes(router: Router) {
  router.post('/auth/login', async (req, res) => {
    try {
      const identity = new IdentityService();
      const result = await identity.post<LoginResponse>(
        '/auth/login',
        req.body
      );

      const { user, session_id } = result.data;
      res.cookie(SESSION_COOKIE, session_id, sessionCookieOptions());
      // The session id lives only in the HttpOnly cookie, never in the body
      res.status(result.status).json({ user });
    } catch (error: any) {
      const status = error?.response?.status || 503;
      const cause = error?.response?.data ?? error?.message ?? 'Unknown error';
      console.error('Login failed:', cause);
      res.status(status).json(
        error?.response?.data ?? {
          error: { status, message: 'Authentication service unavailable' },
        }
      );
    }
  });

  router.post('/auth/logout', async (req, res) => {
    const sessionId: string | undefined = req.cookies?.[SESSION_COOKIE];

    if (sessionId) {
      authCache.invalidate(sessionId);
      try {
        const identity = new IdentityService();
        await identity.post('/auth/logout', {}, undefined, {
          headers: { 'X-Session-ID': sessionId },
        });
      } catch (error: any) {
        // Still clear the cookie even if identity is unreachable
        console.error('Logout against identity failed:', error?.message);
      }
    }

    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.status(200).json({ message: 'Logged out successfully' });
  });

  router.get('/auth/me', authMiddleware, (req, res) => {
    res.status(200).json(req.user);
  });
}
