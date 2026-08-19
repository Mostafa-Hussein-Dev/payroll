// Shared attendance day-state helpers (no server imports — usable anywhere).

export type DayState = "present" | "unpaid" | "paid";

/** Click cycle: present → unpaid absent → paid absent → present. */
export const NEXT_STATE: Record<DayState, DayState> = {
  present: "unpaid",
  unpaid: "paid",
  paid: "present",
};

/** Tailwind classes for a day/toggle button in each state. */
export const STATE_CELL: Record<DayState, string> = {
  present: "bg-white text-slate-700 hover:bg-slate-100",
  unpaid: "bg-red-500 text-white hover:bg-red-600",
  paid: "bg-amber-400 text-amber-950 hover:bg-amber-500",
};

export const STATE_LABEL: Record<DayState, string> = {
  present: "Present",
  unpaid: "Absent — unpaid",
  paid: "Absent — paid",
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
