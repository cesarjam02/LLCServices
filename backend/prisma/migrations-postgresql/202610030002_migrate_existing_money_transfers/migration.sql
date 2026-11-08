ALTER TABLE "Transaction" ADD COLUMN "accountingExcluded" BOOLEAN NOT NULL DEFAULT false;

INSERT INTO "MoneyTransfer" (
    "id", "date", "amount", "commission", "currency", "company", "bank",
    "destinationCountry", "beneficiary", "referenceNumber", "status",
    "receiptPath", "receiptName", "clientId", "createdById", "createdAt", "updatedAt"
)
SELECT
    'migrated-' || transaction."id",
    transaction."date",
    transaction."amount",
    0,
    transaction."currency",
    COALESCE(NULLIF(transaction."provider", ''), 'Sin compañía registrada'),
    NULL,
    NULL,
    transaction."beneficiary",
    transaction."referenceNumber",
    transaction."status",
    transaction."receiptPath",
    transaction."receiptName",
    transaction."clientId",
    transaction."createdById",
    transaction."createdAt",
    transaction."updatedAt"
FROM "Transaction" transaction
INNER JOIN "Category" category ON category."id" = transaction."categoryId"
WHERE category."name" = 'Envíos de dinero'
  AND transaction."clientId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "MoneyTransfer" transfer
    WHERE transfer."id" = 'migrated-' || transaction."id"
  );

UPDATE "Transaction"
SET "accountingExcluded" = true
FROM "Category"
WHERE "Transaction"."categoryId" = "Category"."id"
  AND "Category"."name" = 'Envíos de dinero';
