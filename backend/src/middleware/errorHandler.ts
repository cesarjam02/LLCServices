import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import type { ApiResponse } from '../types/http.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const knownError = error instanceof AppError;
  const statusCode = knownError ? error.statusCode : 500;
  const payload: ApiResponse<never> = {
    success: false,
    error: {
      message: knownError ? error.message : 'Error interno del servidor',
      ...(knownError && error.details !== undefined ? { details: error.details } : {}),
      ...(env.NODE_ENV === 'development' && !knownError ? { details: String(error) } : {}),
    },
  };

  response.status(statusCode).json(payload);
};
