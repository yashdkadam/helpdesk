/*
  Warnings:

  - The primary key for the `ticket` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fromEmail` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `fromName` on the `ticket` table. All the data in the column will be lost.
  - The `id` column on the `ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `senderEmail` to the `ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderName` to the `ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_pkey",
DROP COLUMN "fromEmail",
DROP COLUMN "fromName",
ADD COLUMN     "senderEmail" TEXT NOT NULL,
ADD COLUMN     "senderName" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ticket_pkey" PRIMARY KEY ("id");
