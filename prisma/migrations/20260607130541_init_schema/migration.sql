-- CreateEnum
CREATE TYPE "VersionStatus" AS ENUM ('ACTIVE', 'AMENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('ACTIVE', 'MODIFIED', 'DELETED', 'NEW');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('ADDED', 'MODIFIED', 'DELETED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VIEWER');

-- CreateTable
CREATE TABLE "RegulationType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegulationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Regulation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "typeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Regulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulationVersion" (
    "id" TEXT NOT NULL,
    "regulationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "fullTitle" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "pdfPath" TEXT,
    "originalFileUrl" TEXT,
    "rawText" TEXT,
    "status" "VersionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "amendsId" TEXT,

    CONSTRAINT "RegulationVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "articleNumber" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'ACTIVE',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleChange" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "changeType" "ChangeType" NOT NULL,
    "oldContent" TEXT,
    "newContent" TEXT,
    "diffHtml" TEXT,
    "changedInYear" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegulationType_name_key" ON "RegulationType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RegulationType_shortName_key" ON "RegulationType"("shortName");

-- CreateIndex
CREATE INDEX "Regulation_typeId_idx" ON "Regulation"("typeId");

-- CreateIndex
CREATE INDEX "RegulationVersion_regulationId_idx" ON "RegulationVersion"("regulationId");

-- CreateIndex
CREATE INDEX "RegulationVersion_year_idx" ON "RegulationVersion"("year");

-- CreateIndex
CREATE UNIQUE INDEX "RegulationVersion_regulationId_number_year_key" ON "RegulationVersion"("regulationId", "number", "year");

-- CreateIndex
CREATE INDEX "Article_versionId_idx" ON "Article"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_versionId_articleNumber_key" ON "Article"("versionId", "articleNumber");

-- CreateIndex
CREATE INDEX "ArticleChange_articleId_idx" ON "ArticleChange"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Regulation" ADD CONSTRAINT "Regulation_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "RegulationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationVersion" ADD CONSTRAINT "RegulationVersion_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationVersion" ADD CONSTRAINT "RegulationVersion_amendsId_fkey" FOREIGN KEY ("amendsId") REFERENCES "RegulationVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "RegulationVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleChange" ADD CONSTRAINT "ArticleChange_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
