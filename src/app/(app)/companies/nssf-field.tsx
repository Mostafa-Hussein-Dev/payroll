"use client";

import { useState } from "react";

export function NssfField({
  mode,
  value,
  labels,
}: {
  mode: string;
  value: string;
  labels: {
    label: string;
    percentage: string;
    fixedAmount: string;
    helpPercent: string;
    helpAmount: string;
    helpTail: string;
  };
}) {
  const [m, setM] = useState(mode === "amount" ? "amount" : "percent");

  return (
    <div>
      <label className="label" htmlFor="nssfValue">
        {labels.label}
      </label>
      <div className="flex gap-2">
        <select
          name="nssfMode"
          value={m}
          onChange={(e) => setM(e.target.value)}
          className="input w-36"
        >
          <option value="percent">{labels.percentage}</option>
          <option value="amount">{labels.fixedAmount}</option>
        </select>
        <div className="relative flex-1">
          <input
            id="nssfValue"
            name="nssfValue"
            type="number"
            step="0.01"
            min="0"
            className="input pe-8"
            placeholder={m === "amount" ? "e.g. 25" : "e.g. 3"}
            defaultValue={value}
          />
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            {m === "amount" ? "" : "%"}
          </span>
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {m === "amount" ? labels.helpAmount : labels.helpPercent}{" "}
        {labels.helpTail}
      </p>
    </div>
  );
}
