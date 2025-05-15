import Fastify, { FastifyInstance } from "fastify";
import { serverConfig } from "./config/server.config";
import { registerLiquipediaRoutes } from "./routes/liquipedia/liquipedia.route";

const server: FastifyInstance = Fastify({
  logger: true,
});

server.register(registerLiquipediaRoutes, { prefix: "/liquipedia" });

const start = async () => {
  try {
    console.log(`Starting server in ${serverConfig.env} mode`);
    console.log(
      `Authentication is ${
        serverConfig.env === "development" ? "DISABLED" : "ENABLED"
      }`
    );

    await server.listen({ port: serverConfig.port, host: serverConfig.host });
    const address = server.server.address();

    console.log(`Server listening at ${address?.toString()}`);
  } catch (err) {
    server.log.error(err as Error);
    process.exit(1);
  }
};

start();
