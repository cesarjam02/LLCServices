import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../errors/AppError.js';

export const clientsRouter = Router();
const clientDocumentsDirectory = resolve(process.cwd(), 'uploads', 'clients');
mkdirSync(clientDocumentsDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: clientDocumentsDirectory,
    filename: (_request, file, callback) =>
      callback(null, `${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
  }),
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
  active: z.coerce.boolean().optional(),
});

clientsRouter.get('/', async (request, response) => {
  const search = String(request.query.search ?? '').trim();
  const clients = await prisma.client.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { identification: { contains: search, mode: 'insensitive' } },
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

  const client = await prisma.client.create({
    data: {
      ...parsed.data,
      name: `${parsed.data.firstName} ${parsed.data.lastName}`,
      identification: parsed.data.identification || null,
      documentPath: request.file?.path,
      documentName: request.file?.originalname,
    },
    include: { _count: { select: { transactions: true } } },
  });
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
  response.download(client.documentPath, client.documentName ?? 'documento-cliente');
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
  const client = await prisma.client.update({
    where: { id: current.id },
    data: {
      ...parsed.data,
      name: `${firstName} ${lastName}`,
      identification:
        parsed.data.identification === undefined ? undefined : parsed.data.identification || null,
      ...(request.file
        ? { documentPath: request.file.path, documentName: request.file.originalname }
        : {}),
    },
    include: { _count: { select: { transactions: true } } },
  });
  await prisma.auditLog.create({
    data: {
      action: 'UPDATE',
      entity: 'Client',
      entityId: client.id,
      userId: request.admin!.id,
      metadata: { documentReplaced: Boolean(request.file) },
    },
  });
  if (request.file && current.documentPath && current.documentPath !== request.file.path) {
    await unlink(current.documentPath).catch(() => undefined);
  }
  response.json({ client });
});
