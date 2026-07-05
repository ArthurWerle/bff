import { Router } from 'express';
import { mountAuthRoutes } from './auth';
import { IdentityService, AuthUser } from '../services/IdentityService';
import { authCache } from '../authCache';
import { SESSION_COOKIE } from '../middleware/auth';

jest.mock('../services/IdentityService');

const mockedPost = IdentityService.prototype.post as jest.Mock;

const user: AuthUser = {
  id: 1,
  name: 'Arthur',
  email: 'arthur@example.com',
  enabled: true,
};

// Finds a mounted route handler on the router so we can invoke it directly
const findHandler = (router: Router, method: string, path: string) => {
  const layer = (router as any).stack.find(
    (l: any) => l.route?.path === path && l.route?.methods[method]
  );
  if (!layer) throw new Error(`route ${method} ${path} not mounted`);
  const handlers = layer.route.stack.map((s: any) => s.handle);
  return handlers[handlers.length - 1];
};

const buildRes = () => {
  const res: any = {
    statusCode: 0,
    body: undefined,
    cookies: {} as Record<string, any>,
    cleared: [] as string[],
  };
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((body: any) => {
    res.body = body;
    return res;
  });
  res.cookie = jest.fn((name: string, value: string, options: any) => {
    res.cookies[name] = { value, options };
    return res;
  });
  res.clearCookie = jest.fn((name: string) => {
    res.cleared.push(name);
    return res;
  });
  return res;
};

describe('auth handlers', () => {
  const router = Router();
  mountAuthRoutes(router);

  beforeEach(() => {
    authCache.clear();
    mockedPost.mockReset();
  });

  it('login sets the session cookie and strips session_id from the body', async () => {
    mockedPost.mockResolvedValue({
      status: 200,
      data: { user, session_id: 'secret-session', message: 'Login successful' },
    });

    const login = findHandler(router, 'post', '/auth/login');
    const req: any = { body: { email: user.email, password: 'pw' } };
    const res = buildRes();

    await login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ user });
    expect(res.cookies[SESSION_COOKIE].value).toBe('secret-session');
    expect(res.cookies[SESSION_COOKIE].options.httpOnly).toBe(true);
    expect(JSON.stringify(res.body)).not.toContain('secret-session');
  });

  it('login passes identity errors through', async () => {
    mockedPost.mockRejectedValue({
      response: {
        status: 401,
        data: { error: 'login_failed', message: 'invalid email or password' },
      },
    });

    const login = findHandler(router, 'post', '/auth/login');
    const res = buildRes();

    await login({ body: { email: 'x', password: 'y' } } as any, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      error: 'login_failed',
      message: 'invalid email or password',
    });
  });

  it('logout clears the cookie and invalidates the cache', async () => {
    authCache.set('abc123', user);
    mockedPost.mockResolvedValue({ status: 200, data: {} });

    const logout = findHandler(router, 'post', '/auth/logout');
    const req: any = { cookies: { [SESSION_COOKIE]: 'abc123' } };
    const res = buildRes();

    await logout(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.cleared).toContain(SESSION_COOKIE);
    expect(authCache.get('abc123')).toBeNull();
    expect(mockedPost).toHaveBeenCalledWith('/auth/logout', {}, undefined, {
      headers: { 'X-Session-ID': 'abc123' },
    });
  });

  it('logout still clears the cookie when identity is down', async () => {
    mockedPost.mockRejectedValue(new Error('ECONNREFUSED'));

    const logout = findHandler(router, 'post', '/auth/logout');
    const req: any = { cookies: { [SESSION_COOKIE]: 'abc123' } };
    const res = buildRes();

    await logout(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.cleared).toContain(SESSION_COOKIE);
  });
});
