"use client";

import { useState } from "react";
import { createRun } from "@/lib/actions";
import { MONTHS } from "@/lib/payroll";

export function NewRunForm({
  companyId,
  defaultMonth,
  defaultYear,
}: {
  companyId: string;
  defaultMonth?: number;
  defaultYear?: number;
}) {
  const now = new Date();
  const month = defaultMonth ?? now.getMonth() + 1;
  const year = defaultYear ?? now.getFullYear();
  const [open, setOpen] = useState(false);
  const action = createRun.bind(null, companyId);

  if (!open) {
    return (
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        Open another month
      </button>
    );
  }

  return (
    <form action={action} className="flex items-end gap-2">
      <div>
        <label className="label" htmlFor="month">
          Month
        </label>
        <select id="month" name="month" className="input" defaultValue={month}>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="year">
          Year
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
        Open month
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setOpen(false)}
      >
        Cancel
      </button>
    </form>
  );
}
