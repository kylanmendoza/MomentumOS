-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'deep_work',
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium';
