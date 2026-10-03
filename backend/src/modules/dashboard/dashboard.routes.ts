import { Router } from 'express';
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'node:url';
import { prisma } from '../../config/prisma.js';
import { isTemporaryAdmin } from '../../config/temporaryAdmin.js';

export const dashboardRouter = Router();

function range(query: Record<string, unknown>) {
  const now = new Date();
  const year = Number(query.year ?? now.getFullYear());
  const month = Number(query.month ?? now.getMonth() + 1);
  return {
    year,
    month,
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

dashboardRouter.get('/summary', async (request, response) => {
  const { year, month, start, end } = range(request.query);
  if (isTemporaryAdmin(request.admin?.id)) {
    response.json({
      period: { year, month },
      totals: { income: 0, expenses: 0, balance: 0, transactions: 0, clients: 0 },
      byMethod: {},
      daily: Array.from(
        { length: new Date(Date.UTC(year, month, 0)).getUTCDate() },
        (_, index) => ({
          day: index + 1,
          income: 0,
          expenses: 0,
        }),
      ),
      recent: [],
      temporary: true,
    });
    return;
  }
  const [rows, recent, clients] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        date: { gte: start, lt: end },
        status: { not: 'VOIDED' },
        accountingExcluded: false,
      },
      select: { amount: true, type: true, paymentMethod: true, provider: true, date: true },
    }),
    prisma.transaction.findMany({
      include: { client: true, category: true },
      where: { accountingExcluded: false },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.client.count({ where: { active: true } }),
  ]);
  const income = rows
    .filter((row) => row.type === 'INCOME')
    .reduce((sum, row) => sum + Number(row.amount), 0);
  const expenses = rows
    .filter((row) => row.type === 'EXPENSE')
    .reduce((sum, row) => sum + Number(row.amount), 0);
  const byMethod = rows.reduce<Record<string, number>>(
    (acc, row) => ({
      ...acc,
      [row.paymentMethod]: (acc[row.paymentMethod] ?? 0) + Number(row.amount),
    }),
    {},
  );
  const daily = Array.from(
    { length: new Date(Date.UTC(year, month, 0)).getUTCDate() },
    (_, index) => ({
      day: index + 1,
      income: 0,
      expenses: 0,
    }),
  );
  rows.forEach((row) => {
    const item = daily[row.date.getUTCDate() - 1];
    if (item) item[row.type === 'INCOME' ? 'income' : 'expenses'] += Number(row.amount);
  });
  response.json({
    period: { year, month },
    totals: { income, expenses, balance: income - expenses, transactions: rows.length, clients },
    byMethod,
    daily,
    recent,
  });
});

dashboardRouter.get('/report.xlsx', async (request, response) => {
  const { year, month, start, end } = range(request.query);
  const rows = await prisma.transaction.findMany({
    where: { date: { gte: start, lt: end }, accountingExcluded: false },
    include: {
      client: true,
      category: true,
    },
    orderBy: { date: 'asc' },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'L&E Multiservices LLC';
  workbook.company = 'L&E Multiservices LLC';
  workbook.created = new Date();
  const logoId = workbook.addImage({
    filename: fileURLToPath(new URL('../../../../frontend/src/images/logo.jpeg', import.meta.url)),
    extension: 'jpeg',
  });

  const purple = 'FF501091';
  const green = 'FF15835B';
  const red = 'FFC3424F';
  const gold = 'FFE8A63A';
  const dark = 'FF35243F';
  const white = 'FFFFFFFF';
  const borderColor = 'FFE5DDE9';
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const methodLabels: Record<string, string> = {
    CASH: 'Efectivo',
    CHECK: 'Cheque',
    TRANSFER: 'Transferencia',
    CARD: 'Tarjeta',
    OTHER: 'Otro',
  };
  const statusLabels: Record<string, string> = {
    COMPLETED: 'Completado',
    PENDING: 'Pendiente',
    VOIDED: 'Anulado',
  };

  const validRows = rows.filter((row) => row.status !== 'VOIDED');
  const income = validRows
    .filter((row) => row.type === 'INCOME')
    .reduce((sum, row) => sum + Number(row.amount), 0);
  const expenses = validRows
    .filter((row) => row.type === 'EXPENSE')
    .reduce((sum, row) => sum + Number(row.amount), 0);
  const categoryTotals = new Map<string, { income: number; expenses: number; count: number }>();
  validRows.forEach((row) => {
    const category = categoryTotals.get(row.category.name) ?? {
      income: 0,
      expenses: 0,
      count: 0,
    };
    category.count += 1;
    category[row.type === 'INCOME' ? 'income' : 'expenses'] += Number(row.amount);
    categoryTotals.set(row.category.name, category);
  });

  const report = workbook.addWorksheet('Informe mensual', {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 20 },
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  report.columns = [
    { width: 15 },
    { width: 20 },
    { width: 25 },
    { width: 28 },
    { width: 20 },
    { width: 16 },
    { width: 18 },
  ];
  report.mergeCells('A1:G2');
  report.getCell('A1').value = 'L&E MULTISERVICES LLC · DASHBOARD GENERAL';
  report.getCell('A1').font = { bold: true, size: 20, color: { argb: white } };
  report.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: purple } };
  report.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  report.mergeCells('A4:B5');
  report.mergeCells('C4:G5');
  report.getCell('C4').value =
    `${months[month - 1]} ${year} · Generado el ${new Date().toLocaleString('es-EC')}`;
  report.getCell('C4').font = { italic: true, color: { argb: dark } };
  report.getCell('C4').alignment = { horizontal: 'center', vertical: 'middle' };
  report.getRow(4).height = 25;
  report.getRow(5).height = 25;
  report.addImage(logoId, {
    tl: { col: 0.08, row: 3.18 },
    ext: { width: 190, height: 42 },
  });
  const cards = [
    ['A6:B6', 'A7:B8', 'INGRESOS', income, green],
    ['C6:D6', 'C7:D8', 'EGRESOS', expenses, red],
    ['E6:F6', 'E7:F8', 'BALANCE', income - expenses, purple],
    ['G6:G6', 'G7:G8', 'MOVIMIENTOS', validRows.length, gold],
  ] as const;
  cards.forEach(([labelRange, valueRange, label, value, color], index) => {
    report.mergeCells(labelRange);
    report.mergeCells(valueRange);
    const labelCell = report.getCell(labelRange.split(':')[0]!);
    const valueCell = report.getCell(valueRange.split(':')[0]!);
    labelCell.value = label;
    labelCell.font = { bold: true, color: { argb: white } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
    valueCell.value = value;
    valueCell.font = { bold: true, size: 18, color: { argb: dark } };
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF8FB' } };
    valueCell.alignment = { horizontal: 'center', vertical: 'middle' };
    if (index !== 3) valueCell.numFmt = '$#,##0.00;[Red]($#,##0.00);-';
  });

  report.mergeCells('A10:G10');
  report.getCell('A10').value = 'RESUMEN POR CATEGORÍA';
  report.getCell('A10').font = { bold: true, size: 13, color: { argb: purple } };
  report.getRow(11).values = ['Categoría', 'Ingresos', 'Egresos', 'Balance', 'Movimientos'];
  report.mergeCells('E11:G11');
  const sortedCategories = Array.from(categoryTotals.entries()).sort(([nameA], [nameB]) =>
    nameA.localeCompare(nameB, 'es'),
  );
  sortedCategories.forEach(([category, values], index) => {
    const rowNumber = 12 + index;
    report.getCell(rowNumber, 1).value = category;
    report.getCell(rowNumber, 2).value = values.income;
    report.getCell(rowNumber, 3).value = values.expenses;
    report.getCell(rowNumber, 4).value = values.income - values.expenses;
    report.mergeCells(rowNumber, 5, rowNumber, 7);
    report.getCell(rowNumber, 5).value = values.count;
  });
  const categoryEnd = 11 + sortedCategories.length;
  const totalRow = categoryEnd + 1;
  report.getCell(totalRow, 1).value = 'TOTAL DEL MES';
  report.getCell(totalRow, 2).value = income;
  report.getCell(totalRow, 3).value = expenses;
  report.getCell(totalRow, 4).value = income - expenses;
  report.mergeCells(totalRow, 5, totalRow, 7);
  report.getCell(totalRow, 5).value = validRows.length;

  const movementTitleRow = totalRow + 3;
  const movementHeaderRow = movementTitleRow + 1;
  report.mergeCells(movementTitleRow, 1, movementTitleRow, 7);
  report.getCell(movementTitleRow, 1).value = 'MOVIMIENTOS REGISTRADOS DURANTE EL MES';
  report.getCell(movementTitleRow, 1).font = { bold: true, size: 13, color: { argb: purple } };
  report.getRow(movementHeaderRow).values = [
    'Fecha',
    'Tipo',
    'Categoría',
    'Cliente / concepto',
    'Método',
    'Estado',
    'Monto',
  ];
  rows.forEach((row, index) => {
    const rowNumber = movementHeaderRow + 1 + index;
    report.getRow(rowNumber).values = [
      row.date,
      row.type === 'INCOME' ? 'Ingreso' : 'Egreso',
      row.category.name,
      row.client?.name ?? row.provider ?? row.description ?? '—',
      methodLabels[row.paymentMethod] ?? row.paymentMethod,
      statusLabels[row.status] ?? row.status,
      Number(row.amount),
    ];
    report.getCell(rowNumber, 1).numFmt = 'dd/mm/yyyy';
    report.getCell(rowNumber, 7).numFmt = '$#,##0.00;[Red]($#,##0.00);-';
    if (index % 2 === 1) {
      report.getRow(rowNumber).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFAF8FB' },
      };
    }
  });

  [11, movementHeaderRow].forEach((rowNumber) => {
    const header = report.getRow(rowNumber);
    header.height = 26;
    header.font = { bold: true, color: { argb: white } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: purple } };
    header.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  for (let rowNumber = 12; rowNumber <= totalRow; rowNumber += 1) {
    report.getRow(rowNumber).eachCell((cell) => {
      cell.border = { bottom: { style: 'hair', color: { argb: borderColor } } };
    });
    [2, 3, 4].forEach((column) => {
      report.getCell(rowNumber, column).numFmt = '$#,##0.00;[Red]($#,##0.00);-';
    });
  }
  report.getRow(totalRow).font = { bold: true, color: { argb: dark } };
  report.getRow(totalRow).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF2ECF8' },
  };
  report.autoFilter = {
    from: { row: movementHeaderRow, column: 1 },
    to: { row: movementHeaderRow, column: 7 },
  };
  report.pageSetup.printArea = `A1:G${Math.max(movementHeaderRow + rows.length, totalRow)}`;

  const buffer = await workbook.xlsx.writeBuffer();
  response
    .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .attachment(`informe-financiero-${year}-${String(month).padStart(2, '0')}.xlsx`)
    .send(Buffer.from(buffer));
});
