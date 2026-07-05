import { authMiddleware, SESSION_COOKIE } from './auth';
import { IdentityService, AuthUser } from '../services/IdentityService';
import { authCache } from '../authCache';

jest.mock('../services/IdentityService');

const mockedPost = IdentityService.prototype.post as jest.Mock;

const user: AuthUser = {
  id: 1,
  name: 'Arthur',
  email: 'arthur@example.com',
  enabled: true,
};

const buildRes = () => {
  const res: any = {
    statusCode: 0,
    body: undefined,
    cookies: {} as Record<string, string>,
  };
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((body: any) => {
    res.body = body;
    return res;
  });
  res.cookie = jest.fn((name: string, value: string) => {
    res.cookies[name] = value;
    return res;
  });
  return res;
};

describe('authMiddleware', () => {
  beforeEach(() => {
    authCache.clear();
    mockedPost.mockReset();
  });

  it('rejects requests without a session cookie', async () => {
    const req: any = { cookies: {} };
    const res = buildRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('validates the session against identity and attaches the user', async () => {
    mockedPost.mockResolvedValue({ status: 200, data: user });

    const req: any = { cookies: { [SESSION_COOKIE]: 'abc123' } };
    const res = buildRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(mockedPost).toHaveBeenCalledWith('/auth/validate', {}, undefined, {
      headers: { 'X-Session-ID': 'abc123' },
    });
    expect(req.user).toEqual(user);
    expect(res.cookie).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('serves repeat requests from the cache without calling identity', async () => {
    mockedPost.mockResolvedValue({ status: 200, data: user });

    const req: any = { cookies: { [SESSION_COOKIE]: 'abc123' } };
    await authMiddleware(req, buildRes(), jest.fn());

    const next = jest.fn();
    const secondReq: any = { cookies: { [SESSION_COOKIE]: 'abc123' } };
    await authMiddleware(secondReq, buildRes(), next);

    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(secondReq.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });

  it('rejects invalid sessions with 401', async () => {
    mockedPost.mockRejectedValue({ response: { status: 401 } });

    const req: any = { cookies: { [SESSION_COOKIE]: 'expired' } };
    const res = buildRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 503 when identity is unreachable', async () => {
    mockedPost.mockRejectedValue(new Error('ECONNREFUSED'));

    const req: any = { cookies: { [SESSION_COOKIE]: 'abc123' } };
    const res = buildRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });
});
