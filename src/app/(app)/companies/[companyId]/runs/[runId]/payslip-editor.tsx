"use client";

import { useMemo, useState } from "react";
import { num } from "@/lib/format";

type PayslipData = {
  id: string;
  employeeName: string;
  employeeNo: string | null;
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
  loanBalanceBefore: number;
  netPay: number;
};

const EARNINGS: { key: keyof PayslipData; label: string }[] = [
  { key: "baseSalary", label: "Salary (الراتب)" },
  { key: "transportAllowance", label: "Transport (بدل نقل)" },
  { key: "familyAllowance", label: "Family (تعويض عائلي)" },
  { key: "overtime", label: "Overtime (عمل اضافي)" },
  { key: "salaryAdjAddition", label: "Salary adj. + (تقديمات تعديل)" },
  { key: "otherAdditions", label: "Other + (تقديمات اخرى)" },
];

const DEDUCTIONS: { key: keyof PayslipData; label: string }[] = [
  { key: "nssfDeduction", label: "NSSF (اشتراك الضمان)" },
  { key: "nssfDifference", label: "NSSF diff. (فرق ضمان)" },
  { key: "absenceDeduction", label: "Absence (حسومات غياب)" },
  { key: "salaryAdjDeduction", label: "Salary adj. − (حسومات تعديل)" },
  { key: "purchases", label: "Purchases (مشتريات)" },
  { key: "advance", label: "Advance (سلفة)" },
  { key: "loanPayment", label: "Loan payment (دفعة قرض)" },
];

export function PayslipEditor({
  currency,
  locked,
  absence,
  payslip,
}: {
  currency: string;
  locked: boolean;
  absence: { days: number; unpaidDays: number };
  payslip: PayslipData;
}) {
  const initial = useMemo(() => {
    const o: Record<string, number> = {};
    for (const f of [...EARNINGS, ...DEDUCTIONS]) {
      o[f.key] = payslip[f.key] as number;
    }
    return o;
  }, [payslip]);

  const [vals, setVals] = useState<Record<string, number>>(initial);
  const prefix = `${payslip.id}__`;

  const totalEarnings = EARNINGS.reduce((s, f) => s + (vals[f.key] || 0), 0);
  const totalDeductions = DEDUCTIONS.reduce(
    (s, f) => s + (vals[f.key] || 0),
    0
  );
  const net = totalEarnings - totalDeductions;
  const loanRemaining = payslip.loanBalanceBefore - (vals.loanPayment || 0);

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{payslip.employeeName}</h3>
          <p className="text-xs text-slate-400">
            {payslip.employeeNo ? `No. ${payslip.employeeNo} · ` : ""}
            {absence.days > 0 ? (
              <span className="text-amber-600">
                {absence.days} absent day{absence.days === 1 ? "" : "s"} this
                month
                {absence.unpaidDays > 0
                  ? ` (${absence.unpaidDays} unpaid)`
                  : ""}
              </span>
            ) : (
              "no absences this month"
            )}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Net due (المستحق للدفع)</div>
          <div className="text-xl font-bold text-brand-700">
            {num(net)} {currency}
          </div>
        </div>
      </div>

      <input
        type="hidden"
        name={`${prefix}loanBalanceBefore`}
        value={payslip.loanBalanceBefore}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-green-700">
            Earnings
          </h4>
          <div className="space-y-2">
            {EARNINGS.map((f) => (
              <Field
                key={f.key}
                name={`${prefix}${f.key}`}
                label={f.label}
                value={vals[f.key]}
                locked={locked}
                onChange={(v) => setVals((s) => ({ ...s, [f.key]: v }))}
              />
            ))}
          </div>
          <Total
            label="Total earnings"
            value={totalEarnings}
            currency={currency}
          />
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-red-700">Deductions</h4>
          <div className="space-y-2">
            {DEDUCTIONS.map((f) => (
              <Field
                key={f.key}
                name={`${prefix}${f.key}`}
                label={f.label}
                value={vals[f.key]}
                locked={locked}
                onChange={(v) => setVals((s) => ({ ...s, [f.key]: v }))}
              />
            ))}
          </div>
          <Total
            label="Total deductions"
            value={totalDeductions}
            currency={currency}
          />
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
        Loan: {num(payslip.loanBalanceBefore)} → {num(loanRemaining)} {currency}
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  value,
  locked,
  onChange,
}: {
  name: string;
  label: string;
  value: number;
  locked: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-600">{label}</span>
      <input
        name={name}
        type="number"
        step="0.01"
        defaultValue={value}
        readOnly={locked}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="input w-32 text-right read-only:bg-slate-50"
      />
    </label>
  );
}

function Total({
  label,
  value,
  currency,
}: {
  label: string;
  value: number;
  currency: string;
}) {
  return (
    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-sm font-medium">
      <span>{label}</span>
      <span>
        {num(value)} {currency}
      </span>
    </div>
  );
}
