-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('ALUMINUM', 'GLASS', 'SILICON', 'COPPER');

-- AlterEnum
ALTER TYPE "AssetStatus" ADD VALUE 'ART_LISTED_FOR_SALE';

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "dimensionHeight" DOUBLE PRECISION,
ADD COLUMN     "dimensionLength" DOUBLE PRECISION,
ADD COLUMN     "dimensionWidth" DOUBLE PRECISION,
ADD COLUMN     "healthPercentage" DOUBLE PRECISION,
ADD COLUMN     "measuredVoltage" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "RecycleRecord" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "panelWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "aluminumKg" DOUBLE PRECISION NOT NULL,
    "glassKg" DOUBLE PRECISION NOT NULL,
    "siliconKg" DOUBLE PRECISION NOT NULL,
    "copperKg" DOUBLE PRECISION NOT NULL,
    "blockchainTxHash" TEXT,
    "materialsTxHash" TEXT,
    "ipfsHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecycleRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialStock" (
    "id" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "name" TEXT NOT NULL,
    "totalKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reservedKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerKg" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecycleRecord_assetId_key" ON "RecycleRecord"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialStock_type_key" ON "MaterialStock"("type");

-- AddForeignKey
ALTER TABLE "RecycleRecord" ADD CONSTRAINT "RecycleRecord_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecycleRecord" ADD CONSTRAINT "RecycleRecord_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
