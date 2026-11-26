-- DropForeignKey
ALTER TABLE "invite_codes" DROP CONSTRAINT "invite_codes_studentId_fkey";

-- DropForeignKey
ALTER TABLE "invite_codes" DROP CONSTRAINT "invite_codes_usedById_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "invite_codes";

