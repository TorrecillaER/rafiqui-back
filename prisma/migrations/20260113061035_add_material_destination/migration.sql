-- CreateEnum
CREATE TYPE "MaterialDestination" AS ENUM ('MANUFACTURING', 'CONSTRUCTION', 'RESEARCH', 'RECYCLING_CENTER', 'OTHER');

-- AlterTable
ALTER TABLE "MaterialOrder" ADD COLUMN     "destination" "MaterialDestination" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "destinationNotes" TEXT;
