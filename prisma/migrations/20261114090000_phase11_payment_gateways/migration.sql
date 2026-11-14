-- AlterTable
ALTER TABLE "FeePayment" ADD COLUMN     "gatewayTransactionId" TEXT,
ADD COLUMN     "rawGatewayPayload" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_gatewayTransactionId_key" ON "FeePayment"("gatewayTransactionId");

-- CreateIndex
CREATE INDEX "FeePayment_gatewayTransactionId_idx" ON "FeePayment"("gatewayTransactionId");
