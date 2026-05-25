-- AlterTable
ALTER TABLE "patch_notes" ADD COLUMN "titleTranslations" JSONB;
ALTER TABLE "patch_notes" ADD COLUMN "summaryTranslations" JSONB;

-- AlterEnum
ALTER TYPE "ScrapeSource" ADD VALUE 'BLIZZARD_PATCH_NOTES_EN';
