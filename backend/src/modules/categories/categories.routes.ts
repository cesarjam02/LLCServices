import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { isTemporaryAdmin } from '../../config/temporaryAdmin.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (request, response) => {
  if (isTemporaryAdmin(request.admin?.id)) {
    const names = [
      'Tarjetas de presentación',
      'Courier',
      'Money Orders',
      'Impresiones y fax',
      'Citas consulares',
      'Pago de facturas',
      'Extras',
      'Arriendo',
      'Electricidad / PSEG',
      'Agua',
      'Internet / Optimum',
      'Teléfono celular',
      'Impuestos',
      'Comisiones bancarias',
      'Empleados',
      'Gastos de oficina',
      'Otros',
    ];
    response.json({
      categories: names.map((name, index) => ({ id: `temporary-${index}`, name, active: true })),
    });
    return;
  }
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });
  response.json({ categories });
});
