-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CANDIDATE', 'EMPLOYER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'CANDIDATE';

