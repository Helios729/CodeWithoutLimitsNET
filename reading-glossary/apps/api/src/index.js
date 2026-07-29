import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

async function main() {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, origins: env.corsOrigins },
      'Code Without Limits API listening'
    );
  });

  // Railway sends SIGTERM on redeploy. Draining in-flight requests before
  // closing the database avoids half-written attempt documents.
  const shutdown = (signal) => async () => {
    logger.info({ signal }, 'shutting down');
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 15_000).unref();
  };

  process.on('SIGTERM', shutdown('SIGTERM'));
  process.on('SIGINT', shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error({ reason }, 'unhandled rejection'));
}

main().catch((err) => {
  logger.error({ err }, 'failed to start');
  process.exit(1);
});
