-- AlterTable
ALTER TABLE "heroes" ADD COLUMN "descriptionTranslations" JSONB;

-- AlterTable
ALTER TABLE "hero_abilities" ADD COLUMN "descriptionTranslations" JSONB;

-- AlterEnum
ALTER TYPE "ScrapeSource" ADD VALUE 'BLIZZARD_HERO_EN';
