-- CreateEnum
CREATE TYPE "HeroRole" AS ENUM ('TANK', 'DAMAGE', 'SUPPORT');

-- CreateEnum
CREATE TYPE "AbilitySlot" AS ENUM ('PASSIVE', 'PRIMARY', 'SECONDARY', 'ABILITY_1', 'ABILITY_2', 'ULTIMATE');

-- CreateEnum
CREATE TYPE "PatchNoteStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "EntryCategory" AS ENUM ('HERO_BALANCE', 'BUG_FIX', 'MAP', 'SYSTEM', 'GENERAL');

-- CreateEnum
CREATE TYPE "ScrapeSource" AS ENUM ('BLIZZARD_PATCH_NOTES', 'NAMUWIKI_HERO');

-- CreateEnum
CREATE TYPE "ScrapeStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "heroes" (
    "id" SERIAL NOT NULL,
    "codename" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "HeroRole" NOT NULL,
    "releasedAt" TIMESTAMP(3) NOT NULL,
    "portraitUrl" TEXT,
    "description" TEXT,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "heroes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_stats" (
    "id" SERIAL NOT NULL,
    "heroId" INTEGER NOT NULL,
    "health" INTEGER NOT NULL,
    "armor" INTEGER NOT NULL DEFAULT 0,
    "shield" INTEGER NOT NULL DEFAULT 0,
    "moveSpeed" DOUBLE PRECISION NOT NULL,
    "extras" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "hero_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_abilities" (
    "id" SERIAL NOT NULL,
    "heroId" INTEGER NOT NULL,
    "slot" "AbilitySlot" NOT NULL,
    "key" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stats" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "hero_abilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_stat_revisions" (
    "id" SERIAL NOT NULL,
    "heroId" INTEGER NOT NULL,
    "patchNoteId" INTEGER NOT NULL,
    "diff" JSONB NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hero_stat_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patch_notes" (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "releasedAt" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "summary" TEXT,
    "status" "PatchNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "patch_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patch_note_entries" (
    "id" SERIAL NOT NULL,
    "patchNoteId" INTEGER NOT NULL,
    "category" "EntryCategory" NOT NULL,
    "heroId" INTEGER,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patch_note_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_jobs" (
    "id" SERIAL NOT NULL,
    "source" "ScrapeSource" NOT NULL,
    "target" TEXT NOT NULL,
    "status" "ScrapeStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "diffSummary" JSONB,

    CONSTRAINT "scrape_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "heroes_codename_key" ON "heroes"("codename");

-- CreateIndex
CREATE INDEX "heroes_role_idx" ON "heroes"("role");

-- CreateIndex
CREATE UNIQUE INDEX "hero_stats_heroId_key" ON "hero_stats"("heroId");

-- CreateIndex
CREATE INDEX "hero_abilities_heroId_idx" ON "hero_abilities"("heroId");

-- CreateIndex
CREATE UNIQUE INDEX "hero_abilities_heroId_slot_order_key" ON "hero_abilities"("heroId", "slot", "order");

-- CreateIndex
CREATE INDEX "hero_stat_revisions_heroId_appliedAt_idx" ON "hero_stat_revisions"("heroId", "appliedAt");

-- CreateIndex
CREATE INDEX "hero_stat_revisions_patchNoteId_idx" ON "hero_stat_revisions"("patchNoteId");

-- CreateIndex
CREATE UNIQUE INDEX "patch_notes_version_key" ON "patch_notes"("version");

-- CreateIndex
CREATE UNIQUE INDEX "patch_notes_sourceUrl_key" ON "patch_notes"("sourceUrl");

-- CreateIndex
CREATE INDEX "patch_notes_releasedAt_idx" ON "patch_notes"("releasedAt");

-- CreateIndex
CREATE INDEX "patch_notes_status_idx" ON "patch_notes"("status");

-- CreateIndex
CREATE INDEX "patch_note_entries_patchNoteId_order_idx" ON "patch_note_entries"("patchNoteId", "order");

-- CreateIndex
CREATE INDEX "patch_note_entries_heroId_idx" ON "patch_note_entries"("heroId");

-- CreateIndex
CREATE INDEX "scrape_jobs_source_startedAt_idx" ON "scrape_jobs"("source", "startedAt");

-- CreateIndex
CREATE INDEX "scrape_jobs_status_idx" ON "scrape_jobs"("status");

-- AddForeignKey
ALTER TABLE "hero_stats" ADD CONSTRAINT "hero_stats_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "heroes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_abilities" ADD CONSTRAINT "hero_abilities_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "heroes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_stat_revisions" ADD CONSTRAINT "hero_stat_revisions_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "heroes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_stat_revisions" ADD CONSTRAINT "hero_stat_revisions_patchNoteId_fkey" FOREIGN KEY ("patchNoteId") REFERENCES "patch_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patch_note_entries" ADD CONSTRAINT "patch_note_entries_patchNoteId_fkey" FOREIGN KEY ("patchNoteId") REFERENCES "patch_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patch_note_entries" ADD CONSTRAINT "patch_note_entries_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "heroes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
