-- CreateEnum
CREATE TYPE "HeroChangeType" AS ENUM ('HERO_STAT_CHANGED', 'ABILITY_ADDED', 'ABILITY_REMOVED', 'ABILITY_NAME_CHANGED', 'ABILITY_DESCRIPTION_CHANGED', 'ABILITY_STATS_CHANGED', 'PERK_ADDED', 'PERK_REMOVED', 'PERK_NAME_CHANGED', 'PERK_DESCRIPTION_CHANGED');

-- CreateTable
CREATE TABLE "hero_change_logs" (
    "id" SERIAL NOT NULL,
    "heroId" INTEGER NOT NULL,
    "scrapeJobId" INTEGER,
    "changeType" "HeroChangeType" NOT NULL,
    "target" TEXT NOT NULL,
    "targetKey" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hero_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hero_change_logs_heroId_createdAt_idx" ON "hero_change_logs"("heroId", "createdAt");

-- CreateIndex
CREATE INDEX "hero_change_logs_changeType_idx" ON "hero_change_logs"("changeType");

-- CreateIndex
CREATE INDEX "hero_change_logs_scrapeJobId_idx" ON "hero_change_logs"("scrapeJobId");

-- AddForeignKey
ALTER TABLE "hero_change_logs" ADD CONSTRAINT "hero_change_logs_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "heroes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_change_logs" ADD CONSTRAINT "hero_change_logs_scrapeJobId_fkey" FOREIGN KEY ("scrapeJobId") REFERENCES "scrape_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
