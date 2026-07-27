// Payroll calculation helpers. All amounts are plain numbers here;
// conversion to/from Prisma Decimal happens at the DB boundary.

export type PayslipAmounts = {
  baseSalary: number;
  transportAllowance: number;
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

export const EARNING_FIELDS: (keyof PayslipAmounts)[] = [
  "baseSalary",
  "transportAllowance",
  "familyAllowance",
  "overtime",
  "salaryAdjAddition",
  "otherAdditions",
];

export const DEDUCTION_FIELDS: (keyof PayslipAmounts)[] = [
  "nssfDeduction",
  "nssfDifference",
  "absenceDeduction",
  "salaryAdjDeduction",
  "purchases",
  "advance",
  "loanPayment",
];

export function totalEarnings(a: PayslipAmounts): number {
  return EARNING_FIELDS.reduce((s, f) => s + (a[f] || 0), 0);
}

export function totalDeductions(a: PayslipAmounts): number {
  return DEDUCTION_FIELDS.reduce((s, f) => s + (a[f] || 0), 0);
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
