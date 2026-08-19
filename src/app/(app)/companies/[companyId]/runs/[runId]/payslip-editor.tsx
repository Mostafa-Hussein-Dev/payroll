"use client";

import { useMemo, useState } from "react";
import { num } from "@/lib/format";
import { Dict, tf } from "@/lib/i18n";

type T = Dict["payslip"];

type PayslipData = {
  id: string;
  employeeName: string;
  employeeNo: string | null;
  baseSalary: number;
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
  loanBalanceBefore: number;
  netPay: number;
};

type FieldKey = keyof PayslipData;

// Earnings other than transport (transport is derived from rate × days).
const EARNING_KEYS: FieldKey[] = [
  "baseSalary",
  "familyAllowance",
  "overtime",
  "salaryAdjAddition",
  "otherAdditions",
];
const DEDUCTION_KEYS: FieldKey[] = [
  "nssfDeduction",
  "nssfDifference",
  "absenceDeduction",
  "salaryAdjDeduction",
  "purchases",
  "advance",
  "loanPayment",
];

const NUMERIC_KEYS: FieldKey[] = [
  ...EARNING_KEYS,
  "dailyTransportRate",
  "daysWorked",
  ...DEDUCTION_KEYS,
];

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function PayslipEditor({
  currency,
  locked,
  absence,
  payslip,
  t,
}: {
  currency: string;
  locked: boolean;
  absence: { days: number; unpaidDays: number };
  payslip: PayslipData;
  t: T;
}) {
  const labelFor: Record<string, string> = {
    baseSalary: t.salary,
    familyAllowance: t.family,
    overtime: t.overtime,
    salaryAdjAddition: t.salaryAdjPlus,
    otherAdditions: t.otherPlus,
    nssfDeduction: t.nssf,
    nssfDifference: t.nssfDiff,
    absenceDeduction: t.absence,
    salaryAdjDeduction: t.salaryAdjMinus,
    purchases: t.purchases,
    advance: t.advance,
    loanPayment: t.loanPayment,
  };

  const initial = useMemo(() => {
    const o: Record<string, number> = {};
    for (const k of NUMERIC_KEYS) o[k] = payslip[k] as number;
    return o;
  }, [payslip]);

  const [vals, setVals] = useState<Record<string, number>>(initial);
  const prefix = `${payslip.id}__`;
  const set = (k: string) => (v: number) =>
    setVals((s) => ({ ...s, [k]: v }));

  const transport = round2(
    (vals.dailyTransportRate || 0) * (vals.daysWorked || 0)
  );
  const totalEarnings =
    EARNING_KEYS.reduce((s, k) => s + (vals[k] || 0), 0) + transport;
  const totalDeductions = DEDUCTION_KEYS.reduce((s, k) => s + (vals[k] || 0), 0);
  const net = totalEarnings - totalDeductions;
  const loanRemaining = payslip.loanBalanceBefore - (vals.loanPayment || 0);

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{payslip.employeeName}</h3>
          <p className="text-xs text-slate-400">
            {payslip.employeeNo ? `#${payslip.employeeNo} · ` : ""}
            {absence.days > 0 ? (
              <span className="text-amber-600">
                {tf(t.absentDays, { n: absence.days })}
                {absence.unpaidDays > 0
                  ? tf(t.unpaidParen, { n: absence.unpaidDays })
                  : ""}
              </span>
            ) : (
              t.noAbsences
            )}
          </p>
        </div>
        <div className="text-end">
          <div className="text-xs text-slate-500">{t.netDue}</div>
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
            {t.earnings}
          </h4>
          <div className="space-y-2">
            <Field
              name={`${prefix}baseSalary`}
              label={t.salary}
              value={vals.baseSalary}
              locked={locked}
              onChange={set("baseSalary")}
            />

            {/* Transport = daily rate × days worked */}
            <Field
              name={`${prefix}dailyTransportRate`}
              label={t.dailyTransport}
              value={vals.dailyTransportRate}
              locked={locked}
              onChange={set("dailyTransportRate")}
            />
            <Field
              name={`${prefix}daysWorked`}
              label={t.daysWorked}
              value={vals.daysWorked}
              locked={locked}
              onChange={set("daysWorked")}
            />
            <div className="flex items-center justify-between gap-3 rounded-md bg-green-50 px-2 py-1 text-sm">
              <span className="text-slate-600">{t.transportComputed}</span>
              <span className="font-medium">
                {num(transport)} {currency}
              </span>
            </div>

            {EARNING_KEYS.filter((k) => k !== "baseSalary").map((k) => (
              <Field
                key={k}
                name={`${prefix}${k}`}
                label={labelFor[k]}
                value={vals[k]}
                locked={locked}
                onChange={set(k)}
              />
            ))}
          </div>
          <Total
            label={t.totalEarnings}
            value={totalEarnings}
            currency={currency}
          />
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-red-700">
            {t.deductions}
          </h4>
          <div className="space-y-2">
            {DEDUCTION_KEYS.map((k) => (
              <Field
                key={k}
                name={`${prefix}${k}`}
                label={labelFor[k]}
                value={vals[k]}
                locked={locked}
                onChange={set(k)}
              />
            ))}
          </div>
          <Total
            label={t.totalDeductions}
            value={totalDeductions}
            currency={currency}
          />
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
        {t.loan}: {num(payslip.loanBalanceBefore)} → {num(loanRemaining)}{" "}
        {currency}
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
        className="input w-32 text-end read-only:bg-slate-50"
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
