import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../lib/logger.js';

mongoose.set('strictQuery', true);
// Disable automatic index building in production. Indexes are created by the
// deploy step instead, so a rolling restart never triggers a surprise index
// build against a live collection.
mongoose.set('autoIndex', !env.isProduction);

export async function connectDatabase(uri = env.MONGODB_URI) {
  mongoose.connection.on('connected', () => logger.info('mongodb connected'));
  mongoose.connection.on('disconnected', () => logger.warn('mongodb disconnected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'mongodb error'));

  await mongoose.connect(uri, {
    dbName: env.MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 20,
    minPoolSize: 2,
    retryWrites: true
  });

  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
}

export function databaseReady() {
  return mongoose.connection.readyState === 1;
}
