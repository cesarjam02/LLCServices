-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'ACCOUNTANT', 'EMPLOYEE') NOT NULL DEFAULT 'ADMIN',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Client` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `identification` VARCHAR(191) NULL,
    `documentPath` TEXT NULL,
    `documentName` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Client_phone_key`(`phone`),
    INDEX `Client_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('INCOME', 'EXPENSE') NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
    `paymentMethod` ENUM('CASH', 'CHECK', 'TRANSFER', 'CARD', 'OTHER') NOT NULL,
    `status` ENUM('COMPLETED', 'VOIDED', 'PENDING') NOT NULL DEFAULT 'COMPLETED',
    `amount` DECIMAL(12, 2) NOT NULL,
    `accountingExcluded` BOOLEAN NOT NULL DEFAULT false,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `provider` VARCHAR(191) NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `beneficiary` VARCHAR(191) NULL,
    `beneficiaryPhone` VARCHAR(191) NULL,
    `destinationStreet` VARCHAR(191) NULL,
    `destinationCity` VARCHAR(191) NULL,
    `receiptPath` TEXT NULL,
    `receiptName` TEXT NULL,
    `clientId` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Transaction_date_idx`(`date`),
    INDEX `Transaction_provider_idx`(`provider`),
    INDEX `Transaction_clientId_idx`(`clientId`),
    INDEX `Transaction_type_date_idx`(`type`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MoneyTransfer` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `commission` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `company` VARCHAR(191) NOT NULL,
    `bank` VARCHAR(191) NULL,
    `destinationCountry` VARCHAR(191) NULL,
    `beneficiary` VARCHAR(191) NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `status` ENUM('COMPLETED', 'VOIDED', 'PENDING') NOT NULL DEFAULT 'COMPLETED',
    `receiptPath` TEXT NULL,
    `receiptName` TEXT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MoneyTransfer_date_idx`(`date`),
    INDEX `MoneyTransfer_clientId_date_idx`(`clientId`, `date`),
    INDEX `MoneyTransfer_company_date_idx`(`company`, `date`),
    INDEX `MoneyTransfer_bank_idx`(`bank`),
    INDEX `MoneyTransfer_currency_idx`(`currency`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    INDEX `AuditLog_entity_entityId_idx`(`entity`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MoneyTransfer` ADD CONSTRAINT `MoneyTransfer_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MoneyTransfer` ADD CONSTRAINT `MoneyTransfer_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
