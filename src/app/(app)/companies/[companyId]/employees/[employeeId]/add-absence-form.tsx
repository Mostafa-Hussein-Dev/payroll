"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AbsenceFormState } from "@/lib/actions";

type Action = (
  prev: AbsenceFormState,
  form: FormData
) => Promise<AbsenceFormState>;

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Adding…" : "Add"}
    </button>
  );
}

export function AddAbsenceForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState<AbsenceFormState, FormData>(
    action,
    null
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={today}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="kind">
            Type
          </label>
          <select
            id="kind"
            name="kind"
            className="input w-28"
            defaultValue="full"
          >
            <option value="full">Full day</option>
            <option value="half">Half day</option>
          </select>
        </div>
        <div className="min-w-[10rem] flex-1">
          <label className="label" htmlFor="reason">
            Reason (optional)
          </label>
          <input
            id="reason"
            name="reason"
            className="input"
            placeholder="Sick, personal…"
          />
        </div>
        <label className="mb-2 flex items-center gap-2 text-sm">
          <input type="checkbox" name="paid" className="h-4 w-4" />
          Paid / excused
        </label>
        <div className="mb-0.5">
          <Submit />
        </div>
      </div>

      {state?.error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
