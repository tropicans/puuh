-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('UPLOAD_PDF', 'SYNC_JR');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "RegulationVersion" ADD COLUMN     "extractionMethod" TEXT;

-- CreateTable
CREATE TABLE "ProcessTask" (
    "id" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcessTask_status_idx" ON "ProcessTask"("status");

-- CreateIndex
CREATE INDEX "ProcessTask_createdAt_idx" ON "ProcessTask"("createdAt");
