import { setAttendance } from "@/lib/actions";
import {
  DayState,
  NEXT_STATE,
  STATE_CELL,
  WEEKDAYS,
  pad2 as pad,
} from "@/lib/attendance";

/**
 * Month attendance grid. Each day cycles present → unpaid → paid on click.
 * `states` maps day-of-month (1..31) to its current state.
 */
export function AttendanceCalendar({
  companyId,
  employeeId,
  year,
  month, // 1-12
  states,
  returnTo,
}: {
  companyId: string;
  employeeId: string;
  year: number;
  month: number;
  states: Map<number, DayState>;
  returnTo: string;
}) {
  const set = setAttendance.bind(null, companyId, employeeId);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0=Sun

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`b${i}`} />;
          const state = states.get(d) ?? "present";
          const date = `${year}-${pad(month)}-${pad(d)}`;
          return (
            <form key={d} action={set}>
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="next" value={NEXT_STATE[state]} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button
                type="submit"
                title={`${date} — ${state}`}
                className={`aspect-square w-full rounded-md border border-slate-200 text-sm font-medium transition-colors ${STATE_CELL[state]}`}
              >
                {d}
              </button>
            </form>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-slate-200 bg-white" />
          Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-500" />
          Absent — unpaid
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-400" />
          Absent — paid
        </span>
        <span className="text-slate-400">Click a day to change it.</span>
      </div>
    </div>
  );
}
