-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "standardWorkDays" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "Payslip" ADD COLUMN     "standardWorkDays" INTEGER NOT NULL DEFAULT 30;
