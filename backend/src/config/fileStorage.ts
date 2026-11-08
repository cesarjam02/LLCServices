import { createHash } from 'node:crypto';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import type { Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import { AppError } from '../errors/AppError.js';

const prefix = 'dbfile:';
// Each insert stays well below typical MySQL packet limits, including SQL encoding overhead.
const chunkSize = 256 * 1024;

export function validateFileContent(buffer: Buffer, mimeType: string) {
  const signatures: Record<string, boolean> = {
    'application/pdf': buffer.subarray(0, 5).toString() === '%PDF-',
    'image/jpeg': buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
    'image/png': buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    'application/msword': buffer
      .subarray(0, 8)
      .equals(Buffer.from([208, 207, 17, 224, 161, 177, 26, 225])),
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': buffer
      .subarray(0, 4)
      .equals(Buffer.from([80, 75, 3, 4])),
  };
  if (!buffer.length || !signatures[mimeType]) {
    throw new AppError(
      'El contenido del archivo no coincide con su tipo. Usa un archivo válido.',
      400,
    );
  }
}

export async function storeFile(tx: Prisma.TransactionClient, file: Express.Multer.File) {
  validateFileContent(file.buffer, file.mimetype);
  const stored = await tx.storedFile.create({
    data: {
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.buffer.length,
      sha256: createHash('sha256').update(file.buffer).digest('hex'),
    },
  });
  for (let offset = 0; offset < file.buffer.length; offset += chunkSize) {
    await tx.fileChunk.create({
      data: {
        fileId: stored.id,
        position: offset / chunkSize,
        data: new Uint8Array(file.buffer.subarray(offset, offset + chunkSize)),
      },
    });
  }
  return `${prefix}${stored.id}`;
}

export async function removeStoredFile(tx: Prisma.TransactionClient, path: string) {
  if (path.startsWith(prefix))
    await tx.storedFile.deleteMany({ where: { id: path.slice(prefix.length) } });
}

export async function downloadFile(response: Response, path: string, name: string) {
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (path.startsWith(prefix)) {
    const stored = await prisma.storedFile.findUnique({
      where: { id: path.slice(prefix.length) },
      include: { chunks: { orderBy: { position: 'asc' } } },
    });
    if (!stored) throw new AppError('No se encontró el archivo adjunto', 404);
    const bytes = Buffer.concat(stored.chunks.map((chunk) => Buffer.from(chunk.data)));
    if (
      bytes.length !== stored.size ||
      createHash('sha256').update(bytes).digest('hex') !== stored.sha256
    ) {
      throw new AppError('No se pudo verificar la integridad del archivo', 500);
    }
    response.attachment(name || stored.name);
    response.type(stored.mimeType);
    response.send(bytes);
    return;
  }
  // Read older disk attachments only from the application's upload directories.
  const legacyPath = resolve(path);
  const roots = [
    resolve(process.cwd(), 'uploads'),
    fileURLToPath(new URL('../../uploads/', import.meta.url)),
  ];
  if (
    !roots.some((root) => {
      const child = relative(root, legacyPath);
      return child && child !== '..' && !child.startsWith(`..${sep}`) && !isAbsolute(child);
    })
  )
    throw new AppError('Archivo fuera del almacenamiento permitido', 404);
  try {
    await access(legacyPath);
  } catch {
    throw new AppError('No se encontró el archivo adjunto anterior', 404);
  }
  response.download(legacyPath, name);
}
