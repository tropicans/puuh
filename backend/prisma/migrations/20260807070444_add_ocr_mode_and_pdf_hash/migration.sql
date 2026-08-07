-- CreateEnum
CREATE TYPE "OcrMode" AS ENUM ('AUTO', 'FORCE', 'SKIP');

-- AlterTable
ALTER TABLE "RegulationVersion" ADD COLUMN     "ocrMode" "OcrMode" NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "pdfMd5Hash" TEXT;

-- CreateIndex
CREATE INDEX "RegulationVersion_pdfMd5Hash_idx" ON "RegulationVersion"("pdfMd5Hash");
