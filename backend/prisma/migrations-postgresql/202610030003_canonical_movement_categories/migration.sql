UPDATE "Category"
SET "active" = false
WHERE "name" NOT IN (
  'Citas consulares',
  'Courier',
  'Extras',
  'Impresiones y fax',
  'Money Orders',
  'Otros',
  'Pago de facturas',
  'Tarjetas de presentación'
);

UPDATE "Category"
SET "active" = true,
    "type" = NULL
WHERE "name" IN (
  'Citas consulares',
  'Courier',
  'Extras',
  'Impresiones y fax',
  'Money Orders',
  'Otros',
  'Pago de facturas',
  'Tarjetas de presentación'
);
