-- CreateEnum
CREATE TYPE "BookmarkKind" AS ENUM ('HERO', 'PLAYER');

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "kind" "BookmarkKind" NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_kind_targetId_key" ON "bookmarks"("userId", "kind", "targetId");

-- CreateIndex
CREATE INDEX "bookmarks_userId_kind_createdAt_idx" ON "bookmarks"("userId", "kind", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
