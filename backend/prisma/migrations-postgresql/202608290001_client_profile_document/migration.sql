ALTER TABLE "Client" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Client" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Client" ADD COLUMN "documentPath" TEXT;
ALTER TABLE "Client" ADD COLUMN "documentName" TEXT;

UPDATE "Client"
SET "firstName" = COALESCE(NULLIF(SPLIT_PART("name", ' ', 1), ''), "name"),
    "lastName" = CASE
      WHEN POSITION(' ' IN "name") > 0 THEN SUBSTRING("name" FROM POSITION(' ' IN "name") + 1)
      ELSE ''
    END,
    "address" = COALESCE("address", 'Sin dirección registrada');

ALTER TABLE "Client" ALTER COLUMN "address" SET NOT NULL;
