-- Employee: replace flat monthly transport allowance with a daily transport rate.
ALTER TABLE "Employee" DROP COLUMN "transportAllowance";
ALTER TABLE "Employee" ADD COLUMN "dailyTransportRate" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- Payslip: transport is now derived (daily rate × days worked); keep the
-- computed result in transportAllowance and record the inputs.
ALTER TABLE "Payslip" ADD COLUMN "dailyTransportRate" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "Payslip" ADD COLUMN "daysWorked" DECIMAL(6,2) NOT NULL DEFAULT 0;
