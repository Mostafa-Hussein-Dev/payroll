"use client";

import { useState } from "react";
import { createRun } from "@/lib/actions";
import { MONTHS } from "@/lib/payroll";

export function NewRunForm({ companyId }: { companyId: string }) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const action = createRun.bind(null, companyId);

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + New run
      </button>
    );
  }

  return (
    <form action={action} className="flex items-end gap-2">
      <div>
        <label className="label" htmlFor="month">
          Month
        </label>
        <select
          id="month"
          name="month"
          className="input"
          defaultValue={now.getMonth() + 1}
        >
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
          defaultValue={now.getFullYear()}
        />
      </div>
      <button type="submit" className="btn-primary">
        Create
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
