import { AuthCache } from './authCache';
import { AuthUser } from './services/IdentityService';

const user: AuthUser = {
  id: 1,
  name: 'Arthur',
  email: 'arthur@example.com',
  enabled: true,
};

describe('AuthCache', () => {
  it('returns cached users within the TTL', () => {
    const cache = new AuthCache(60_000);
    cache.set('session-1', user);

    expect(cache.get('session-1')).toEqual(user);
  });

  it('expires entries after the TTL', () => {
    jest.useFakeTimers();
    const cache = new AuthCache(1_000);
    cache.set('session-1', user);

    jest.advanceTimersByTime(1_500);

    expect(cache.get('session-1')).toBeNull();
    jest.useRealTimers();
  });

  it('is disabled when TTL is zero', () => {
    const cache = new AuthCache(0);
    cache.set('session-1', user);

    expect(cache.get('session-1')).toBeNull();
  });

  it('invalidates single sessions', () => {
    const cache = new AuthCache(60_000);
    cache.set('session-1', user);
    cache.set('session-2', user);
    cache.invalidate('session-1');

    expect(cache.get('session-1')).toBeNull();
    expect(cache.get('session-2')).toEqual(user);
  });
});
