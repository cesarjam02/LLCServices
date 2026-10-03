import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { apiRouter } from './routes/index.js';

export function createApp() {
  const app = express();
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        const isLocalDevelopment =
          env.NODE_ENV === 'development' &&
          /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin ?? '');
        if (!origin || allowedOrigins.includes(origin) || isLocalDevelopment) {
          callback(null, true);
          return;
        }
        callback(new Error('Origen no autorizado por CORS'));
      },
    }),
  );
  app.use(cookieParser());
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/', (_request, response) => {
    response.json({ name: 'Lily API', version: '1.0.0', docs: '/api/v1/health' });
  });
  app.use('/api/v1', apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
