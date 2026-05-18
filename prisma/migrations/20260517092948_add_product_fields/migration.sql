-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brewing" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "englishName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "features" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "storage" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "subtitle" TEXT NOT NULL DEFAULT '';
