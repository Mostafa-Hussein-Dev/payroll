// Payroll calculation helpers. All amounts are plain numbers here;
// conversion to/from Prisma Decimal happens at the DB boundary.

export type PayslipAmounts = {
  baseSalary: number;
  // transport is derived: dailyTransportRate × daysWorked
  dailyTransportRate: number;
  daysWorked: number;
  familyAllowance: number;
  overtime: number;
  salaryAdjAddition: number;
  otherAdditions: number;
  nssfDeduction: number;
  nssfDifference: number;
  absenceDeduction: number;
  salaryAdjDeduction: number;
  purchases: number;
  advance: number;
  loanPayment: number;
};

/**
 * Raw numeric fields captured from the payslip form and stored as-is.
 * `transportAllowance` is NOT here — it is derived via transportAllowance().
 */
export const INPUT_FIELDS: (keyof PayslipAmounts)[] = [
  "baseSalary",
  "dailyTransportRate",
  "daysWorked",
  "familyAllowance",
  "overtime",
  "salaryAdjAddition",
  "otherAdditions",
  "nssfDeduction",
  "nssfDifference",
  "absenceDeduction",
  "salaryAdjDeduction",
  "purchases",
  "advance",
  "loanPayment",
];

/** بدل نقل = daily transport rate × days worked. */
export function transportAllowance(a: PayslipAmounts): number {
  return round2((a.dailyTransportRate || 0) * (a.daysWorked || 0));
}

export function totalEarnings(a: PayslipAmounts): number {
  return round2(
    (a.baseSalary || 0) +
      transportAllowance(a) +
      (a.familyAllowance || 0) +
      (a.overtime || 0) +
      (a.salaryAdjAddition || 0) +
      (a.otherAdditions || 0)
  );
}

export function totalDeductions(a: PayslipAmounts): number {
  return round2(
    (a.nssfDeduction || 0) +
      (a.nssfDifference || 0) +
      (a.absenceDeduction || 0) +
      (a.salaryAdjDeduction || 0) +
      (a.purchases || 0) +
      (a.advance || 0) +
      (a.loanPayment || 0)
  );
}

/** المستحق للدفع = earnings - deductions */
export function netPay(a: PayslipAmounts): number {
  return round2(totalEarnings(a) - totalDeductions(a));
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Default NSSF (الضمان) contribution.
 * mode "amount"  -> flat money amount (value used as-is).
 * mode "percent" -> value is a percentage of base salary (3 = 3%).
 */
export function computeNssf(
  baseSalary: number,
  mode: string,
  value: number
): number {
  if (mode === "amount") return round2(value);
  return round2((baseSalary * value) / 100);
}

/** أجر اليوم = base salary ÷ standard work days (0 if no standard days set). */
export function dailyWage(baseSalary: number, standardWorkDays: number): number {
  if (!standardWorkDays || standardWorkDays <= 0) return 0;
  return round2(baseSalary / standardWorkDays);
}

/** Total absence days for a list of absences (half-day counts as 0.5). */
export function absenceDays(list: { kind: string }[]): number {
  return list.reduce((s, a) => s + (a.kind === "half" ? 0.5 : 1), 0);
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthLabel(month: number, year: number) {
  return `${MONTHS[month - 1] ?? month} ${year}`;
}
