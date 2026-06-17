-- CreateTable
CREATE TABLE "monitoring_logs" (
    "id" SERIAL NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "passed" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "durationMs" INTEGER,
    "fixPrUrl" TEXT,
    "notes" TEXT,

    CONSTRAINT "monitoring_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monitoring_logs_kind_runAt_idx" ON "monitoring_logs"("kind", "runAt" DESC);
