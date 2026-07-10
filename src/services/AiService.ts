import { Service } from './Service';

// Thin HTTP client for the ai-internal (Fastify) service. It listens on
// container port 3005; host port 3040 is only the staging Docker mapping.
// Set AI_INTERNAL_URL to the shared docker service name or the staging box.
export class AiService extends Service {
  constructor() {
    super(process.env.AI_INTERNAL_URL || 'http://ai-internal:3005');
  }
}
