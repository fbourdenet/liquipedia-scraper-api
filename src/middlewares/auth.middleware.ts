import { FastifyRequest, FastifyReply, RouteOptions, HookHandlerDoneFunction } from 'fastify';
import { serverConfig } from '../config/server.config';

// Check if in development mode
const isDevelopment = serverConfig.env === 'development';

// Bearer token authentication function
export function authenticateBearer(request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) {
  // Skip authentication in development mode
  if (isDevelopment) {
    console.log('Development mode: Skipping authentication');
    return done();
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
  
  done();
}

// Create route options with authentication
export function withAuth(options: Partial<RouteOptions> = {}): Partial<RouteOptions> {
  // Skip adding auth in development mode
  if (isDevelopment) {
    return options;
  }
  
  return {
    ...options,
    preHandler: authenticateBearer
  };
}
