import { FastifyRequest, FastifyReply, RouteOptions } from 'fastify';
import { serverConfig } from '../config/server.config';

// Check if in development mode
const isDevelopment = serverConfig.env === 'development';

// Create route options with authentication
export function withAuth(options: Partial<RouteOptions> = {}) {
  // Return a handler function that can be used in preHandler
  return async function(request: FastifyRequest, reply: FastifyReply) {
    // Skip authentication in development mode
    if (isDevelopment) {
      console.log('Development mode: Skipping authentication');
      return;
    }
    
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Unauthorized',
        message: 'Missing authentication token'
      });
    }
    
    const token = authHeader.slice(7);
    
    if (token !== serverConfig.key) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Unauthorized',
        message: 'Invalid authentication token'
      });
    }
  };
}
