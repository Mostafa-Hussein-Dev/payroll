"use client";

import { useState } from "react";

export function NssfField({
  mode,
  value,
}: {
  mode: string;
  value: string;
}) {
  const [m, setM] = useState(mode === "amount" ? "amount" : "percent");

  return (
    <div>
      <label className="label" htmlFor="nssfValue">
        NSSF (الضمان) employee contribution
      </label>
      <div className="flex gap-2">
        <select
          name="nssfMode"
          value={m}
          onChange={(e) => setM(e.target.value)}
          className="input w-36"
        >
          <option value="percent">Percentage %</option>
          <option value="amount">Fixed amount</option>
        </select>
        <div className="relative flex-1">
          <input
            id="nssfValue"
            name="nssfValue"
            type="number"
            step="0.01"
            min="0"
            className="input pr-8"
            placeholder={m === "amount" ? "e.g. 25" : "e.g. 3"}
            defaultValue={value}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            {m === "amount" ? "" : "%"}
          </span>
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {m === "amount"
          ? "A fixed money amount deducted per payslip."
          : "A percentage of each employee's base salary (3 = 3%)."}{" "}
        Pre-fills the NSSF deduction on new payslips.
      </p>
    </div>
  );
}
