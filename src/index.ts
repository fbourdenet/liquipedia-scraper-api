import Fastify, { FastifyInstance } from "fastify";
import { registerUpcomingMatchesRoutes } from "./routes/upcoming-matches/upcoming-matches.route";
import { serverConfig } from "./config/server.config";

const server: FastifyInstance = Fastify({
  logger: true,
});

server.register(registerUpcomingMatchesRoutes, { prefix: "/upcoming-matches" });

// Run the server
const start = async () => {
  try {
    // Log authentication mode
    console.log(`Starting server in ${serverConfig.env} mode`);
    console.log(`Authentication is ${serverConfig.env === 'development' ? 'DISABLED' : 'ENABLED'}`);
    
    await server.listen({ port: serverConfig.port, host: serverConfig.host });
    const address = server.server.address();

    console.log(`Server listening at ${address?.toString()}`);
  } catch (err) {
    server.log.error(err as Error);
    process.exit(1);
  }
};

start();
