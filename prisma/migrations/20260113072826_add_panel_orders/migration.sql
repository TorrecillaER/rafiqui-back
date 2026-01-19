-- CreateEnum
CREATE TYPE "PanelPurchaseDestination" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'RESEARCH', 'RESALE', 'OTHER');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "buyerWallet" TEXT,
ADD COLUMN     "soldAt" TIMESTAMP(3),
ADD COLUMN     "tokenId" TEXT;

-- CreateTable
CREATE TABLE "PanelOrder" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "buyerId" TEXT,
    "buyerWallet" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "destination" "PanelPurchaseDestination" NOT NULL DEFAULT 'OTHER',
    "destinationNotes" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "blockchainTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PanelOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PanelOrder" ADD CONSTRAINT "PanelOrder_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelOrder" ADD CONSTRAINT "PanelOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
