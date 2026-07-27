-- CreateTable
CREATE TABLE "Absence" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'full',
    "reason" TEXT,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Absence_employeeId_idx" ON "Absence"("employeeId");

-- CreateIndex
CREATE INDEX "Absence_date_idx" ON "Absence"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Absence_employeeId_date_key" ON "Absence"("employeeId", "date");

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
