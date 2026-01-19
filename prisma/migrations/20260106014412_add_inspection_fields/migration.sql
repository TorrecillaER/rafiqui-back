-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "inspectedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "notes" TEXT;
