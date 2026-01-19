-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "walletAddress" TEXT;

-- CreateTable
CREATE TABLE "MaterialOrder" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "materialType" "MaterialType" NOT NULL,
    "quantityKg" DOUBLE PRECISION NOT NULL,
    "pricePerKg" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "buyerWallet" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "blockchainTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MaterialOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MaterialOrder" ADD CONSTRAINT "MaterialOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
