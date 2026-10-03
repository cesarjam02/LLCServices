import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../errors/AppError.js';

interface TokenPayload {
  sub: string;
  username: string;
  name: string;
  role: string;
}

export const requireAdmin: RequestHandler = async (request, _response, next) => {
  const token = request.cookies?.lily_admin as string | undefined;
  if (!token) return next(new AppError('Debes iniciar sesión', 401));

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    const user = await prisma.user.findUnique({ where: { username: payload.username } });
    if (!user?.active || user.role !== 'ADMIN') {
      return next(new AppError('La sesión ya no es válida. Inicia sesión nuevamente', 401));
    }
    request.admin = { id: user.id, username: user.username, name: user.name, role: user.role };
    next();
  } catch {
    next(new AppError('La sesión expiró o no es válida', 401));
  }
};
