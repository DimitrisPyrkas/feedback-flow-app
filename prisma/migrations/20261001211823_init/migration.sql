-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeedbackItem` (
    `id` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `rawContent` VARCHAR(191) NOT NULL,
    `originalTimestamp` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sentiment` VARCHAR(191) NULL,
    `severity` INTEGER NULL,
    `topics` JSON NOT NULL,
    `userId` VARCHAR(191) NULL,
    `status` ENUM('NEW', 'ACKNOWLEDGED', 'ACTIONED') NOT NULL DEFAULT 'NEW',

    INDEX `FeedbackItem_createdAt_idx`(`createdAt`),
    UNIQUE INDEX `FeedbackItem_source_externalId_key`(`source`, `externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeedbackAnalysis` (
    `id` VARCHAR(191) NOT NULL,
    `feedbackItemId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `sentiment` ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE') NOT NULL,
    `topics` JSON NOT NULL,
    `severityScore` INTEGER NOT NULL,
    `summary` VARCHAR(191) NOT NULL,
    `status` ENUM('NEW', 'ACKNOWLEDGED', 'ACTIONED') NOT NULL DEFAULT 'NEW',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FeedbackAnalysis_severityScore_idx`(`severityScore`),
    INDEX `FeedbackAnalysis_status_idx`(`status`),
    INDEX `FeedbackAnalysis_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IngestionLog` (
    `id` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `runId` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TriageAction` (
    `id` VARCHAR(191) NOT NULL,
    `feedbackItemId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `fromStatus` ENUM('NEW', 'ACKNOWLEDGED', 'ACTIONED') NOT NULL,
    `toStatus` ENUM('NEW', 'ACKNOWLEDGED', 'ACTIONED') NOT NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TriageAction_feedbackItemId_createdAt_idx`(`feedbackItemId`, `createdAt`),
    INDEX `TriageAction_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FeedbackItem` ADD CONSTRAINT `FeedbackItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackAnalysis` ADD CONSTRAINT `FeedbackAnalysis_feedbackItemId_fkey` FOREIGN KEY (`feedbackItemId`) REFERENCES `FeedbackItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackAnalysis` ADD CONSTRAINT `FeedbackAnalysis_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TriageAction` ADD CONSTRAINT `TriageAction_feedbackItemId_fkey` FOREIGN KEY (`feedbackItemId`) REFERENCES `FeedbackItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TriageAction` ADD CONSTRAINT `TriageAction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
