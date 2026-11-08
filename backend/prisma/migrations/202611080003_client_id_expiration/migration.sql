-- AlterTable
ALTER TABLE `Client` ADD COLUMN `idExpirationDate` DATE NULL;

-- CreateIndex
CREATE INDEX `Client_active_idExpirationDate_idx` ON `Client`(`active`, `idExpirationDate`);
