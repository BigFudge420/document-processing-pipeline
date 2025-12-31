-- DropIndex
DROP INDEX "DocumentJob_status_idx";

-- CreateIndex
CREATE INDEX "DocumentJob_id_status_attempts_startedAt_idx" ON "DocumentJob"("id", "status", "attempts", "startedAt");
