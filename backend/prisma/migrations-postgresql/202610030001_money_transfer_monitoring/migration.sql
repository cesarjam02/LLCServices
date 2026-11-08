CREATE TABLE "MoneyTransfer" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "commission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "company" TEXT NOT NULL,
    "bank" TEXT,
    "destinationCountry" TEXT,
    "beneficiary" TEXT,
    "referenceNumber" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "receiptPath" TEXT,
    "receiptName" TEXT,
    "clientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyTransfer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MoneyTransfer_date_idx" ON "MoneyTransfer"("date");
CREATE INDEX "MoneyTransfer_clientId_date_idx" ON "MoneyTransfer"("clientId", "date");
CREATE INDEX "MoneyTransfer_company_date_idx" ON "MoneyTransfer"("company", "date");
CREATE INDEX "MoneyTransfer_bank_idx" ON "MoneyTransfer"("bank");
CREATE INDEX "MoneyTransfer_currency_idx" ON "MoneyTransfer"("currency");

ALTER TABLE "MoneyTransfer" ADD CONSTRAINT "MoneyTransfer_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MoneyTransfer" ADD CONSTRAINT "MoneyTransfer_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "Category" SET "active" = false WHERE "name" = 'Envíos de dinero';
