import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../errors/AppError.js';

export const moneyTransfersRouter = Router();
const receiptsDirectory = resolve(process.cwd(), 'uploads', 'money-transfers');
mkdirSync(receiptsDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: receiptsDirectory,
    filename: (_request, file, callback) =>
      callback(null, `${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      callback(new AppError('El recibo debe ser PDF, JPG o PNG', 400));
      return;
    }
    callback(null, true);
  },
});

const transferSchema = z.object({
  date: z.coerce.date(),
  clientId: z.string().min(1, 'Selecciona un cliente'),
  amount: z.coerce.number().positive('El monto debe ser mayor que cero'),
  commission: z.coerce.number().min(0).default(0),
  currency: z.string().trim().min(3).max(10).default('USD'),
  company: z.string().trim().min(2, 'La compañía es obligatoria'),
  bank: z.string().trim().optional(),
  destinationCountry: z.string().trim().optional(),
  beneficiary: z.string().trim().optional(),
  referenceNumber: z.string().trim().optional(),
  status: z.enum(['COMPLETED', 'PENDING', 'VOIDED']).default('COMPLETED'),
});

function period(query: Record<string, unknown>) {
  const now = new Date();
  const year = Math.max(2000, Number(query.year ?? now.getFullYear()));
  const month = Math.min(12, Math.max(1, Number(query.month ?? now.getMonth() + 1)));
  return {
    year,
    month,
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

moneyTransfersRouter.get('/', async (request, response) => {
  const { year, month, start, end } = period(request.query);
  const company = String(request.query.company ?? '').trim();
  const bank = String(request.query.bank ?? '').trim();
  const currency = String(request.query.currency ?? '').trim();
  const clientId = String(request.query.clientId ?? '').trim();
  const where = {
    date: { gte: start, lt: end },
    ...(company ? { company: { contains: company, mode: 'insensitive' as const } } : {}),
    ...(bank ? { bank: { contains: bank, mode: 'insensitive' as const } } : {}),
    ...(currency ? { currency: { equals: currency, mode: 'insensitive' as const } } : {}),
    ...(clientId ? { clientId } : {}),
  };
  const transfers = await prisma.moneyTransfer.findMany({
    where,
    include: { client: true, createdBy: { select: { name: true } } },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: 500,
  });
  const valid = transfers.filter((item) => item.status !== 'VOIDED');
  response.json({
    period: { year, month },
    totals: {
      amount: valid.reduce((sum, item) => sum + Number(item.amount), 0),
      commission: valid.reduce((sum, item) => sum + Number(item.commission), 0),
      count: valid.length,
      clients: new Set(valid.map((item) => item.clientId)).size,
    },
    transfers,
  });
});

moneyTransfersRouter.post('/', upload.single('receipt'), async (request, response) => {
  const parsed = transferSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new AppError('Revisa los datos obligatorios del giro', 400, z.treeifyError(parsed.error));
  }
  const transfer = await prisma.moneyTransfer.create({
    data: {
      ...parsed.data,
      bank: parsed.data.bank || null,
      destinationCountry: parsed.data.destinationCountry || null,
      beneficiary: parsed.data.beneficiary || null,
      referenceNumber: parsed.data.referenceNumber || null,
      receiptPath: request.file?.path,
      receiptName: request.file?.originalname,
      createdById: request.admin!.id,
    },
    include: { client: true, createdBy: { select: { name: true } } },
  });
  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entity: 'MoneyTransfer',
      entityId: transfer.id,
      userId: request.admin!.id,
      metadata: {
        amount: parsed.data.amount,
        commission: parsed.data.commission,
        company: parsed.data.company,
      },
    },
  });
  response.status(201).json({ transfer });
});

moneyTransfersRouter.get('/:id/receipt', async (request, response) => {
  const transfer = await prisma.moneyTransfer.findUnique({
    where: { id: String(request.params.id) },
    select: { receiptPath: true, receiptName: true },
  });
  if (!transfer?.receiptPath) throw new AppError('Este giro no tiene recibo adjunto', 404);
  response.download(transfer.receiptPath, transfer.receiptName ?? 'recibo-giro');
});
