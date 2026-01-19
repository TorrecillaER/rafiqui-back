-- DropForeignKey
ALTER TABLE "MaterialOrder" DROP CONSTRAINT "MaterialOrder_buyerId_fkey";

-- AlterTable
ALTER TABLE "MaterialOrder" ALTER COLUMN "buyerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "MaterialOrder" ADD CONSTRAINT "MaterialOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
