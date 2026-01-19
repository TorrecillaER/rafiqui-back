/*
  Warnings:

  - You are about to drop the column `requestId` on the `Asset` table. All the data in the column will be lost.
  - Added the required column `city` to the `CollectionRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactName` to the `CollectionRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactPhone` to the `CollectionRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `panelType` to the `CollectionRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postalCode` to the `CollectionRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inspectorId` to the `Inspection` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ArtCategory" AS ENUM ('NFT', 'SCULPTURE', 'INSTALLATION');

-- AlterEnum
ALTER TYPE "AssetStatus" ADD VALUE 'INSPECTING';

-- DropForeignKey
ALTER TABLE "Asset" DROP CONSTRAINT "Asset_requestId_fkey";

-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "requestId",
ADD COLUMN     "collectionRequestId" TEXT,
ADD COLUMN     "inspectionStartedAt" TIMESTAMP(3),
ADD COLUMN     "inspectorId" TEXT;

-- AlterTable
ALTER TABLE "CollectionRequest" ADD COLUMN     "assignedCollectorId" TEXT,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "contactName" TEXT NOT NULL,
ADD COLUMN     "contactPhone" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "panelType" TEXT NOT NULL,
ADD COLUMN     "postalCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "inspectorId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ArtPiece" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "category" "ArtCategory" NOT NULL,
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sourceAssetId" TEXT,
    "tokenId" TEXT,
    "contractAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtPiece_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArtPiece_sourceAssetId_key" ON "ArtPiece"("sourceAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtPiece_tokenId_key" ON "ArtPiece"("tokenId");

-- AddForeignKey
ALTER TABLE "CollectionRequest" ADD CONSTRAINT "CollectionRequest_assignedCollectorId_fkey" FOREIGN KEY ("assignedCollectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_collectionRequestId_fkey" FOREIGN KEY ("collectionRequestId") REFERENCES "CollectionRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtPiece" ADD CONSTRAINT "ArtPiece_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
