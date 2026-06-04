-- AlterTable
ALTER TABLE "hero_abilities" ADD COLUMN     "blizzardId" TEXT;

-- CreateIndex
CREATE INDEX "hero_abilities_heroId_blizzardId_idx" ON "hero_abilities"("heroId", "blizzardId");
