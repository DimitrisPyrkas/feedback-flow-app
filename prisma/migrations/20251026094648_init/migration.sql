-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('NEW', 'ACKNOWLEDGED', 'ACTIONED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackItem" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "originalTimestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackAnalysis" (
    "id" TEXT NOT NULL,
    "feedbackItemId" TEXT NOT NULL,
    "userId" TEXT,
    "sentiment" "Sentiment" NOT NULL,
    "topics" JSONB NOT NULL,
    "severityScore" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriageAction" (
    "id" TEXT NOT NULL,
    "feedbackItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromStatus" "Status" NOT NULL,
    "toStatus" "Status" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TriageAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "FeedbackItem_createdAt_idx" ON "FeedbackItem"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackItem_source_externalId_key" ON "FeedbackItem"("source", "externalId");

-- CreateIndex
CREATE INDEX "FeedbackAnalysis_severityScore_idx" ON "FeedbackAnalysis"("severityScore");

-- CreateIndex
CREATE INDEX "FeedbackAnalysis_status_idx" ON "FeedbackAnalysis"("status");

-- CreateIndex
CREATE INDEX "FeedbackAnalysis_createdAt_idx" ON "FeedbackAnalysis"("createdAt");

-- CreateIndex
CREATE INDEX "TriageAction_feedbackItemId_createdAt_idx" ON "TriageAction"("feedbackItemId", "createdAt");

-- CreateIndex
CREATE INDEX "TriageAction_userId_createdAt_idx" ON "TriageAction"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "FeedbackAnalysis" ADD CONSTRAINT "FeedbackAnalysis_feedbackItemId_fkey" FOREIGN KEY ("feedbackItemId") REFERENCES "FeedbackItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackAnalysis" ADD CONSTRAINT "FeedbackAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageAction" ADD CONSTRAINT "TriageAction_feedbackItemId_fkey" FOREIGN KEY ("feedbackItemId") REFERENCES "FeedbackItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageAction" ADD CONSTRAINT "TriageAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
