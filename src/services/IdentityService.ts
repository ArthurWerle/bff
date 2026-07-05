import { Service } from './Service';

// Thin HTTP client for the Go identity service (auth, feature flags).
// Prod default resolves the `identity` container on the shared network;
// staging must set IDENTITY_SERVICE_URL=http://identity-staging:8080/api/v1.
export class IdentityService extends Service {
  constructor() {
    super(process.env.IDENTITY_SERVICE_URL || 'http://identity:8080/api/v1');
  }
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}
