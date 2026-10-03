import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';

export const notFound: RequestHandler = (request, _response, next) => {
  next(new AppError(`Ruta no encontrada: ${request.method} ${request.originalUrl}`, 404));
};
