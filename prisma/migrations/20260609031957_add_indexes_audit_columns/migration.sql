-- AlterTable
ALTER TABLE "RegulationVersion" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Article_versionId_status_idx" ON "Article"("versionId", "status");

-- CreateIndex
CREATE INDEX "Article_versionId_orderIndex_idx" ON "Article"("versionId", "orderIndex");

-- CreateIndex
CREATE INDEX "JudicialReviewImpact_caseId_disposition_idx" ON "JudicialReviewImpact"("caseId", "disposition");

-- CreateIndex
CREATE INDEX "Regulation_typeId_createdAt_idx" ON "Regulation"("typeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RegulationVersion_regulationId_status_idx" ON "RegulationVersion"("regulationId", "status");

-- CreateIndex
CREATE INDEX "RegulationVersion_status_idx" ON "RegulationVersion"("status");
