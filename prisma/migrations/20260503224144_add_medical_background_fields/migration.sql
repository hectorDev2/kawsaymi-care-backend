-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bloodType" TEXT,
ADD COLUMN     "hospitalizations" TEXT,
ADD COLUMN     "surgeries" TEXT,
ADD COLUMN     "transfusions" BOOLEAN,
ADD COLUMN     "vaccines" TEXT;
