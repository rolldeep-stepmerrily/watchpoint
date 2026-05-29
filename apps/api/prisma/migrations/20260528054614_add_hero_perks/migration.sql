-- CreateEnum
CREATE TYPE "PerkTier" AS ENUM ('MINOR', 'MAJOR');

-- AlterTable
ALTER TABLE "patch_note_entries" ADD COLUMN     "perkId" INTEGER;

-- CreateTable
CREATE TABLE "hero_perks" (
    "id" SERIAL NOT NULL,
    "heroId" INTEGER NOT NULL,
    "tier" "PerkTier" NOT NULL,
    "slot" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameTranslations" JSONB,
    "description" TEXT NOT NULL,
    "descriptionTranslations" JSONB,
    "stats" JSONB,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "hero_perks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hero_perks_heroId_idx" ON "hero_perks"("heroId");

-- CreateIndex
CREATE UNIQUE INDEX "hero_perks_heroId_tier_slot_key" ON "hero_perks"("heroId", "tier", "slot");

-- CreateIndex
CREATE INDEX "patch_note_entries_perkId_idx" ON "patch_note_entries"("perkId");

-- AddForeignKey
ALTER TABLE "hero_perks" ADD CONSTRAINT "hero_perks_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "heroes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patch_note_entries" ADD CONSTRAINT "patch_note_entries_perkId_fkey" FOREIGN KEY ("perkId") REFERENCES "hero_perks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
