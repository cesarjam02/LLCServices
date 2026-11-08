import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { downloadFile, storeFile, removeStoredFile } from '../../config/fileStorage.js';
import { AppError } from '../../errors/AppError.js';

export const clientsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      callback(new AppError('El archivo debe ser PDF, JPG, PNG, DOC o DOCX', 400));
      return;
    }
    callback(null, true);
  },
});

const clientSchema = z.object({
  firstName: z.string().trim().min(2, 'El nombre es obligatorio'),
  lastName: z.string().trim().min(2, 'El apellido es obligatorio'),
  phone: z.string().trim().min(7, 'El teléfono es obligatorio'),
  address: z.string().trim().min(5, 'La dirección es obligatoria'),
  identification: z.string().trim().optional(),
  idExpirationDate: z.preprocess(
    (value) => (value === '' ? null : value),
    z.iso
      .date()
      .transform((value) => new Date(`${value}T00:00:00.000Z`))
      .nullable()
      .optional(),
  ),
  active: z.coerce.boolean().optional(),
});

clientsRouter.get('/id-expirations', async (_request, response) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  const limit = new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00.000Z`);
  limit.setUTCDate(limit.getUTCDate() + 7);
  const clients = await prisma.client.findMany({
    where: { active: true, idExpirationDate: { lte: limit } },
    select: { id: true, firstName: true, lastName: true, idExpirationDate: true },
    orderBy: { idExpirationDate: 'asc' },
  });
  response.setHeader('Cache-Control', 'private, no-store');
  response.json({ clients });
});

clientsRouter.get('/', async (request, response) => {
  const search = String(request.query.search ?? '').trim();
  const clients = await prisma.client.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { phone: { contains: search } },
            { identification: { contains: search } },
          ],
        }
      : undefined,
    include: { _count: { select: { transactions: true } } },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: 200,
  });
  response.json({ clients });
});

clientsRouter.post('/', upload.single('document'), async (request, response) => {
  const parsed = clientSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new AppError(
      'Revisa los datos obligatorios del cliente',
      400,
      z.treeifyError(parsed.error),
    );
  }

  const client = await prisma.$transaction(
    async (tx) => {
      const documentPath = request.file ? await storeFile(tx, request.file) : undefined;
      return tx.client.create({
        data: {
          ...parsed.data,
          name: `${parsed.data.firstName} ${parsed.data.lastName}`,
          identification: parsed.data.identification || null,
          documentPath,
          documentName: request.file?.originalname,
        },
        include: { _count: { select: { transactions: true } } },
      });
    },
    { timeout: 30000 },
  );
  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entity: 'Client',
      entityId: client.id,
      userId: request.admin!.id,
      metadata: { documentAttached: Boolean(request.file) },
    },
  });
  response.status(201).json({ client });
});

clientsRouter.get('/:id/document', async (request, response) => {
  const client = await prisma.client.findUnique({
    where: { id: String(request.params.id) },
    select: { documentPath: true, documentName: true },
  });
  if (!client?.documentPath) throw new AppError('Este cliente no tiene documento adjunto', 404);
  await downloadFile(response, client.documentPath, client.documentName ?? 'documento-cliente');
});

clientsRouter.get('/:id', async (request, response) => {
  const client = await prisma.client.findUnique({
    where: { id: String(request.params.id) },
    include: { _count: { select: { transactions: true } } },
  });
  if (!client) throw new AppError('Cliente no encontrado', 404);
  response.json({ client });
});

clientsRouter.patch('/:id', upload.single('document'), async (request, response) => {
  const parsed = clientSchema.partial().safeParse(request.body);
  if (!parsed.success) {
    throw new AppError('Revisa los datos del cliente', 400, z.treeifyError(parsed.error));
  }
  const current = await prisma.client.findUniqueOrThrow({
    where: { id: String(request.params.id) },
  });
  const firstName = parsed.data.firstName ?? current.firstName;
  const lastName = parsed.data.lastName ?? current.lastName;
  const client = await prisma.$transaction(
    async (tx) => {
      const documentPath = request.file ? await storeFile(tx, request.file) : undefined;
      const updated = await tx.client.update({
        where: { id: current.id },
        data: {
          ...parsed.data,
          name: `${firstName} ${lastName}`,
          identification:
            parsed.data.identification === undefined
              ? undefined
              : parsed.data.identification || null,
          ...(request.file ? { documentPath, documentName: request.file.originalname } : {}),
        },
        include: { _count: { select: { transactions: true } } },
      });
      if (request.file && current.documentPath) await removeStoredFile(tx, current.documentPath);
      return updated;
    },
    { timeout: 30000 },
  );
  await prisma.auditLog.create({
    data: {
      action: 'UPDATE',
      entity: 'Client',
      entityId: client.id,
      userId: request.admin!.id,
      metadata: { documentReplaced: Boolean(request.file) },
    },
  });
  response.json({ client });
});
