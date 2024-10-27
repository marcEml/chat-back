/*
  Warnings:

  - Added the required column `image` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `messages` ADD COLUMN `image` VARCHAR(191) NOT NULL;
