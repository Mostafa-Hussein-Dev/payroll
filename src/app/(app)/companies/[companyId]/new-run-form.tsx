"use client";

import { useState } from "react";
import { createRun } from "@/lib/actions";

export function NewRunForm({
  companyId,
  defaultMonth,
  defaultYear,
  labels,
}: {
  companyId: string;
  defaultMonth?: number;
  defaultYear?: number;
  labels: {
    openAnother: string;
    month: string;
    year: string;
    openMonthBtn: string;
    cancel: string;
    months: readonly string[];
  };
}) {
  const now = new Date();
  const month = defaultMonth ?? now.getMonth() + 1;
  const year = defaultYear ?? now.getFullYear();
  const [open, setOpen] = useState(false);
  const action = createRun.bind(null, companyId);

  if (!open) {
    return (
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        {labels.openAnother}
      </button>
    );
  }

  return (
    <form action={action} className="flex items-end gap-2">
      <div>
        <label className="label" htmlFor="month">
          {labels.month}
        </label>
        <select id="month" name="month" className="input" defaultValue={month}>
          {labels.months.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="year">
          {labels.year}
        </label>
        <input
          id="year"
          name="year"
          type="number"
          className="input w-24"
          defaultValue={year}
        />
      </div>
      <button type="submit" className="btn-primary">
        {labels.openMonthBtn}
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setOpen(false)}
      >
        {labels.cancel}
      </button>
    </form>
  );
}
