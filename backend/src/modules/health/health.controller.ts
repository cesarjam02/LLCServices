import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';

export const getHealth: RequestHandler = (_request, response) => {
  response.json({
    status: 'ok',
    message: 'API funcionando correctamente',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
};
