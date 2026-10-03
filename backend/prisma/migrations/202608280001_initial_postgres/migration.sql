CREATE TYPE "Role" AS ENUM ('ADMIN', 'ACCOUNTANT', 'EMPLOYEE');
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CHECK', 'TRANSFER', 'CARD', 'OTHER');
CREATE TYPE "TransactionStatus" AS ENUM ('COMPLETED', 'VOIDED', 'PENDING');

CREATE TABLE "User" ("id" TEXT NOT NULL, "username" TEXT NOT NULL, "name" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "role" "Role" NOT NULL DEFAULT 'ADMIN', "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Client" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "phone" TEXT NOT NULL, "address" TEXT, "identification" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Client_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Category" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "type" "TransactionType", "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Category_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Transaction" ("id" TEXT NOT NULL, "date" TIMESTAMP(3) NOT NULL, "type" "TransactionType" NOT NULL, "paymentMethod" "PaymentMethod" NOT NULL, "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED', "amount" DECIMAL(12,2) NOT NULL, "currency" TEXT NOT NULL DEFAULT 'USD', "provider" TEXT, "referenceNumber" TEXT, "description" TEXT, "beneficiary" TEXT, "beneficiaryPhone" TEXT, "destinationStreet" TEXT, "destinationCity" TEXT, "receiptPath" TEXT, "receiptName" TEXT, "clientId" TEXT, "categoryId" TEXT NOT NULL, "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id"));
CREATE TABLE "AuditLog" ("id" TEXT NOT NULL, "action" TEXT NOT NULL, "entity" TEXT NOT NULL, "entityId" TEXT, "metadata" JSONB, "userId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "Client_phone_key" ON "Client"("phone");
CREATE INDEX "Client_name_idx" ON "Client"("name");
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");
CREATE INDEX "Transaction_provider_idx" ON "Transaction"("provider");
CREATE INDEX "Transaction_clientId_idx" ON "Transaction"("clientId");
CREATE INDEX "Transaction_type_date_idx" ON "Transaction"("type", "date");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
