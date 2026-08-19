import { setAttendance } from "@/lib/actions";

type DayState = "present" | "unpaid" | "paid";

const NEXT: Record<DayState, DayState> = {
  present: "unpaid",
  unpaid: "paid",
  paid: "present",
};

const CELL: Record<DayState, string> = {
  present: "bg-white text-slate-700 hover:bg-slate-100",
  unpaid: "bg-red-500 text-white hover:bg-red-600",
  paid: "bg-amber-400 text-amber-950 hover:bg-amber-500",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

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
              <input type="hidden" name="next" value={NEXT[state]} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button
                type="submit"
                title={`${date} — ${state}`}
                className={`aspect-square w-full rounded-md border border-slate-200 text-sm font-medium transition-colors ${CELL[state]}`}
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
