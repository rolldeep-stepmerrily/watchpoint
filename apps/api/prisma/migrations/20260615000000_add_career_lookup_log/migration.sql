-- CreateEnum
CREATE TYPE "CareerLookupEvent" AS ENUM ('SEARCH', 'SUMMARY');

-- CreateTable
CREATE TABLE "career_lookup_logs" (
    "id" BIGSERIAL NOT NULL,
    "requestId" TEXT NOT NULL,
    "eventType" "CareerLookupEvent" NOT NULL,
    "query" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_lookup_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "career_lookup_logs_createdAt_idx" ON "career_lookup_logs"("createdAt");

-- CreateIndex
CREATE INDEX "career_lookup_logs_ip_createdAt_idx" ON "career_lookup_logs"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "career_lookup_logs_eventType_createdAt_idx" ON "career_lookup_logs"("eventType", "createdAt");
