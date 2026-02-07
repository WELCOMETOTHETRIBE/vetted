-- CreateEnum
CREATE TYPE "OpsTicketType" AS ENUM ('BUG', 'FEATURE');

-- CreateEnum
CREATE TYPE "OpsTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "OpsTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "OpsTicket" (
  "id" TEXT NOT NULL,
  "type" "OpsTicketType" NOT NULL DEFAULT 'BUG',
  "status" "OpsTicketStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "OpsTicketPriority" NOT NULL DEFAULT 'MEDIUM',
  "title" TEXT NOT NULL,
  "description" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OpsTicket_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OpsTicket" ADD CONSTRAINT "OpsTicket_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "OpsTicket_type_idx" ON "OpsTicket"("type");

-- CreateIndex
CREATE INDEX "OpsTicket_status_idx" ON "OpsTicket"("status");

-- CreateIndex
CREATE INDEX "OpsTicket_priority_idx" ON "OpsTicket"("priority");

-- CreateIndex
CREATE INDEX "OpsTicket_createdAt_idx" ON "OpsTicket"("createdAt");

-- CreateIndex
CREATE INDEX "OpsTicket_createdById_idx" ON "OpsTicket"("createdById");

