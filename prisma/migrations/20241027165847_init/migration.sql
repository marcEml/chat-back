/*
  Warnings:

  - You are about to drop the column `teacherId` on the `evaluations` table. All the data in the column will be lost.
  - Added the required column `content` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `evaluations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `evaluations` DROP FOREIGN KEY `evaluations_teacherId_fkey`;

-- AlterTable
ALTER TABLE `evaluations` DROP COLUMN `teacherId`,
    ADD COLUMN `content` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
