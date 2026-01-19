-- AlterTable
ALTER TABLE "ArtPiece" ADD COLUMN     "buyerWallet" TEXT,
ADD COLUMN     "soldAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ArtOrder" (
    "id" TEXT NOT NULL,
    "artPieceId" TEXT NOT NULL,
    "buyerId" TEXT,
    "buyerWallet" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "messageToArtist" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "blockchainTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ArtOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ArtOrder" ADD CONSTRAINT "ArtOrder_artPieceId_fkey" FOREIGN KEY ("artPieceId") REFERENCES "ArtPiece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtOrder" ADD CONSTRAINT "ArtOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
