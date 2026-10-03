import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../errors/AppError.js';
import { isTemporaryAdmin } from '../../config/temporaryAdmin.js';

export const transactionsRouter = Router();
const uploadDirectory = resolve(process.cwd(), 'uploads');
mkdirSync(uploadDirectory, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_request, file, callback) =>
      callback(null, `${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_request, file, callback) =>
    callback(null, ['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype)),
});

const transactionSchema = z.object({
  date: z.coerce.date(),
  type: z.enum(['INCOME', 'EXPENSE']),
  paymentMethod: z.enum(['CASH', 'CHECK', 'TRANSFER', 'CARD', 'OTHER']),
  status: z.enum(['COMPLETED', 'VOIDED', 'PENDING']).default('COMPLETED'),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().length(3).default('USD'),
  categoryId: z.string().min(1),
  clientId: z.string().min(1, 'Selecciona un cliente'),
  provider: z.string().trim().optional(),
  referenceNumber: z.string().trim().optional(),
  description: z.string().trim().optional(),
  beneficiary: z.string().trim().optional(),
  beneficiaryPhone: z.string().trim().optional(),
  destinationStreet: z.string().trim().optional(),
  destinationCity: z.string().trim().optional(),
});

function filters(query: Record<string, unknown>) {
  const start = query.start ? new Date(String(query.start)) : undefined;
  const end = query.end ? new Date(String(query.end)) : undefined;
  if (end) end.setHours(23, 59, 59, 999);
  return {
    accountingExcluded: false,
    ...(start || end
      ? { date: { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } }
      : {}),
    ...(query.type ? { type: String(query.type) as 'INCOME' | 'EXPENSE' } : {}),
    ...(query.method
      ? { paymentMethod: String(query.method) as 'CASH' | 'CHECK' | 'TRANSFER' | 'CARD' | 'OTHER' }
      : {}),
    ...(query.provider ? { provider: { contains: String(query.provider) } } : {}),
    ...(query.clientId ? { clientId: String(query.clientId) } : {}),
    ...(query.categoryId ? { categoryId: String(query.categoryId) } : {}),
  };
}

transactionsRouter.get('/', async (request, response) => {
  if (isTemporaryAdmin(request.admin?.id)) {
    response.json({ transactions: [], pagination: { page: 1, total: 0, pages: 0 } });
    return;
  }
  const page = Math.max(1, Number(request.query.page ?? 1));
  const where = filters(request.query);
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { client: true, category: true, createdBy: { select: { name: true } } },
      orderBy: { date: 'desc' },
      skip: (page - 1) * 25,
      take: 25,
    }),
    prisma.transaction.count({ where }),
  ]);
  response.json({ transactions, pagination: { page, total, pages: Math.ceil(total / 25) } });
});

transactionsRouter.post('/', upload.single('receipt'), async (request, response) => {
  if (isTemporaryAdmin(request.admin?.id)) {
    throw new AppError('Conecta la base de datos para guardar movimientos', 503);
  }
  const parsed = transactionSchema.safeParse(request.body);
  if (!parsed.success)
    throw new AppError('Revisa los datos del movimiento', 400, z.treeifyError(parsed.error));
  if (!request.file) throw new AppError('El comprobante es obligatorio', 400);
  const transaction = await prisma.transaction.create({
    data: {
      ...parsed.data,
      clientId: parsed.data.clientId,
      receiptPath: request.file?.path,
      receiptName: request.file?.originalname,
      createdById: request.admin!.id,
    },
    include: { client: true, category: true },
  });
  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entity: 'Transaction',
      entityId: transaction.id,
      userId: request.admin!.id,
      metadata: { amount: parsed.data.amount, type: parsed.data.type },
    },
  });
  response.status(201).json({ transaction });
});

transactionsRouter.patch('/:id/status', async (request, response) => {
  const parsed = z
    .object({ status: z.enum(['COMPLETED', 'VOIDED', 'PENDING']) })
    .safeParse(request.body);
  if (!parsed.success) throw new AppError('Estado inválido', 400);
  const transaction = await prisma.transaction.update({
    where: { id: String(request.params.id) },
    data: parsed.data,
  });
  await prisma.auditLog.create({
    data: {
      action: 'STATUS_CHANGE',
      entity: 'Transaction',
      entityId: transaction.id,
      userId: request.admin!.id,
      metadata: parsed.data,
    },
  });
  response.json({ transaction });
});

transactionsRouter.get('/:id/receipt', async (request, response) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: String(request.params.id) },
    select: { receiptPath: true, receiptName: true },
  });
  if (!transaction?.receiptPath) throw new AppError('Este movimiento no tiene comprobante', 404);
  response.download(transaction.receiptPath, transaction.receiptName ?? 'comprobante');
});
