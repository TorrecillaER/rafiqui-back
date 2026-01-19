-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DONOR', 'OPERATOR', 'PARTNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PENDING_COLLECTION', 'IN_TRANSIT', 'WAREHOUSE_RECEIVED', 'INSPECTED', 'RECYCLED', 'REUSED', 'READY_FOR_REUSE');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('REUSE', 'RECYCLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'DONOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionRequest" (
    "id" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "estimatedCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "donorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "nfcTagId" TEXT,
    "qrCode" TEXT,
    "status" "AssetStatus" NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "measuredVoltage" DOUBLE PRECISION NOT NULL,
    "measuredAmps" DOUBLE PRECISION NOT NULL,
    "physicalCondition" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "aiRecommendation" "InspectionResult" NOT NULL,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_nfcTagId_key" ON "Asset"("nfcTagId");

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_assetId_key" ON "Inspection"("assetId");

-- AddForeignKey
ALTER TABLE "CollectionRequest" ADD CONSTRAINT "CollectionRequest_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CollectionRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
