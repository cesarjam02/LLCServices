import { compare } from 'bcryptjs';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../errors/AppError.js';
import { requireAdmin } from '../../middleware/auth.js';

export const authRouter = Router();
const loginSchema = z.object({ username: z.string().trim().min(3), password: z.string().min(4) });
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post('/login', loginLimiter, async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) throw new AppError('Credenciales inválidas', 400);

  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user || !user.active || !(await compare(parsed.data.password, user.passwordHash))) {
    throw new AppError('Usuario o contraseña incorrectos', 401);
  }

  const token = jwt.sign(
    { username: user.username, name: user.name, role: user.role },
    env.JWT_SECRET,
    { subject: user.id, expiresIn: '8h' },
  );
  response.cookie('lily_admin', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  });
  await prisma.auditLog.create({
    data: { action: 'LOGIN', entity: 'User', entityId: user.id, userId: user.id },
  });
  response.json({
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
  });
});

authRouter.post('/logout', requireAdmin, async (request, response) => {
  response.clearCookie('lily_admin', { path: '/' });
  response.status(204).send();
});

authRouter.get('/me', requireAdmin, (request, response) => response.json({ user: request.admin }));
