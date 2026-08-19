"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { saveAttendance, AttendanceSaveState } from "@/lib/actions";
import {
  DayState,
  NEXT_STATE,
  STATE_CELL,
  WEEKDAYS,
  pad2 as pad,
} from "@/lib/attendance";

type Labels = {
  present: string;
  unpaid: string;
  paid: string;
  clickDay: string;
  save: string;
  saving: string;
  saved: string;
  unsaved: string;
};

function SaveButton({
  labels,
  dirty,
  saved,
}: {
  labels: Labels;
  dirty: boolean;
  saved: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center gap-3">
      {dirty && !pending && (
        <span className="text-xs text-amber-600">{labels.unsaved}</span>
      )}
      {!dirty && saved && !pending && (
        <span className="text-xs text-green-600">{labels.saved}</span>
      )}
      <button
        type="submit"
        className="btn-primary py-1.5"
        disabled={pending || !dirty}
      >
        {pending ? labels.saving : labels.save}
      </button>
    </div>
  );
}

export function AttendanceCalendar({
  companyId,
  employeeId,
  year,
  month, // 1-12
  initial,
  labels,
}: {
  companyId: string;
  employeeId: string;
  year: number;
  month: number;
  // absent days only: dayOfMonth -> "unpaid" | "paid"
  initial: Record<number, DayState>;
  labels: Labels;
}) {
  const initialKey = useMemo(() => JSON.stringify(initial), [initial]);
  const [states, setStates] = useState<Record<number, DayState>>(
    () => ({ ...initial })
  );
  // Baseline we compare against for the dirty flag (resets after a save).
  const [baseline, setBaseline] = useState(initialKey);

  const currentKey = JSON.stringify(states);
  const dirty = currentKey !== baseline;

  const boundSave = saveAttendance.bind(null, companyId, employeeId);
  const [state, formAction] = useActionState<AttendanceSaveState, FormData>(
    async (prev, form) => {
      const res = await boundSave(prev, form);
      if (res?.ok) setBaseline(JSON.stringify(states));
      return res;
    },
    null
  );

  const cycle = (day: number) => {
    setStates((s) => {
      const cur: DayState = s[day] ?? "present";
      const next = NEXT_STATE[cur];
      const copy = { ...s };
      if (next === "present") delete copy[day];
      else copy[day] = next;
      return copy;
    });
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <form action={formAction}>
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="data" value={currentKey} />

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`b${i}`} />;
          const st: DayState = states[d] ?? "present";
          const date = `${year}-${pad(month)}-${pad(d)}`;
          return (
            <button
              key={d}
              type="button"
              onClick={() => cycle(d)}
              title={`${date} — ${st}`}
              className={`aspect-square w-full rounded-md border border-slate-200 text-sm font-medium transition-colors ${STATE_CELL[st]}`}
            >
              {d}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-slate-200 bg-white" />
            {labels.present}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-red-500" />
            {labels.unpaid}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-400" />
            {labels.paid}
          </span>
          <span className="text-slate-400">{labels.clickDay}</span>
        </div>
        <SaveButton labels={labels} dirty={dirty} saved={!!state?.ok} />
      </div>
    </form>
  );
}
