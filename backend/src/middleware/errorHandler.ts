import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import type { ApiResponse } from '../types/http.js';
import { MulterError } from 'multer';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof MulterError) {
    error = new AppError(
      error.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo supera el tamaño permitido'
        : 'Archivo o formulario no válido',
      error.code === 'LIMIT_FILE_SIZE' ? 413 : 400,
    );
  }
  const knownError = error instanceof AppError;
  const statusCode = knownError ? error.statusCode : 500;
  if (!knownError) {
    // Log identifiers only; database error messages may contain connection secrets.
    console.error('Error interno de API', {
      method: _request.method,
      path: _request.path,
      name: error instanceof Error ? error.name : 'UnknownError',
      code: typeof error?.code === 'string' ? error.code : undefined,
      errorCode: typeof error?.errorCode === 'string' ? error.errorCode : undefined,
    });
  }
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
