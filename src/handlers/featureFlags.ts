import { Router } from 'express';
import { IdentityService } from '../services/IdentityService';
import { SESSION_COOKIE } from '../middleware/auth';

export function mountFeatureFlagRoutes(router: Router) {
  // Is this flag enabled for the logged-in user? (globally enabled OR
  // explicitly assigned). Mounted behind the auth middleware.
  router.get('/feature-flags/check', async (req, res) => {
    try {
      const identity = new IdentityService();
      const result: any = await identity.get('/feature-flags/check', {
        key: req.query.key,
        user_id: req.user!.id,
      });

      res.status(result.status).json(result.data);
    } catch (error: any) {
      const status = error?.response?.status || 502;
      const cause = error?.response?.data ?? error?.message ?? 'Unknown error';
      console.error(
        'Failed to proxy request to GET /feature-flags/check:',
        cause
      );
      res.status(status).json({
        error: 'Failed to proxy request to GET /feature-flags/check',
        cause,
      });
    }
  });

  // Feature flags explicitly assigned to the logged-in user
  router.get('/feature-flags', async (req, res) => {
    try {
      const identity = new IdentityService();
      const result: any = await identity.get(
        `/users/${req.user!.id}/feature-flags`,
        undefined,
        { headers: { 'X-Session-ID': req.cookies?.[SESSION_COOKIE] } }
      );

      res.status(result.status).json(result.data);
    } catch (error: any) {
      const status = error?.response?.status || 502;
      const cause = error?.response?.data ?? error?.message ?? 'Unknown error';
      console.error('Failed to proxy request to GET /feature-flags:', cause);
      res.status(status).json({
        error: 'Failed to proxy request to GET /feature-flags',
        cause,
      });
    }
  });
}
