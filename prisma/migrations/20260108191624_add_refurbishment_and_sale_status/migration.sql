-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssetStatus" ADD VALUE 'REFURBISHING';
ALTER TYPE "AssetStatus" ADD VALUE 'LISTED_FOR_SALE';

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "capacityRetainedPercent" DOUBLE PRECISION,
ADD COLUMN     "measuredPowerWatts" DOUBLE PRECISION,
ADD COLUMN     "refurbishedAt" TIMESTAMP(3),
ADD COLUMN     "refurbishedById" TEXT,
ADD COLUMN     "refurbishmentNotes" TEXT;
