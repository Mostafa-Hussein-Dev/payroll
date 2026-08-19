import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setAttendance, setLoanBalance, createRun } from "@/lib/actions";
import { money, num } from "@/lib/format";
import { absenceDays, monthLabel } from "@/lib/payroll";
import {
  DayState,
  NEXT_STATE,
  STATE_CELL,
  STATE_LABEL,
  pad2,
} from "@/lib/attendance";
import { NewRunForm } from "./new-run-form";
import { AttendanceCalendar } from "./employees/[employeeId]/attendance-calendar";

export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ d?: string; open?: string }>;
}) {
  const { companyId } = await params;
  const { d, open } = await searchParams;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      employees: { orderBy: { name: "asc" } },
      payrollRuns: { orderBy: [{ year: "desc" }, { month: "desc" }] },
    },
  });
  if (!company) notFound();

  const cur = company.currency;

  // Current calendar month — the month the manager opens/closes.
  const nowDate = new Date();
  const curMonth = nowDate.getMonth() + 1;
  const curYear = nowDate.getFullYear();
  const currentRun = company.payrollRuns.find(
    (r) => r.month === curMonth && r.year === curYear
  );

  // Selected attendance day (defaults to today).
  const today = new Date();
  let sel = today;
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const parsed = new Date(`${d}T00:00:00`);
    if (!isNaN(parsed.getTime())) sel = parsed;
  }
  const selYear = sel.getFullYear();
  const selMonth = sel.getMonth() + 1; // 1-12
  const selDay = sel.getDate();
  const selStr = `${selYear}-${pad2(selMonth)}-${pad2(selDay)}`;

  // Absences for the selected month, all employees.
  const monthStart = new Date(Date.UTC(selYear, selMonth - 1, 1));
  const monthEnd = new Date(Date.UTC(selYear, selMonth, 1));
  const absences = await prisma.absence.findMany({
    where: {
      employeeId: { in: company.employees.map((e) => e.id) },
      date: { gte: monthStart, lt: monthEnd },
    },
  });

  const urlWith = (o?: string) => {
    const p = new URLSearchParams();
    p.set("d", selStr);
    if (o) p.set("open", o);
    return `/companies/${companyId}?${p.toString()}`;
  };
  const currentUrl = urlWith(open);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:underline">
            ← Companies
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{company.name}</h1>
          <p className="text-sm text-slate-500">
            {cur} · NSSF{" "}
            {company.nssfMode === "amount"
              ? money(Number(company.nssfValue), cur)
              : `${Number(company.nssfValue).toFixed(2)}%`}
            {company.address ? ` · ${company.address}` : ""}
          </p>
        </div>
        <Link href={`/companies/${company.id}/edit`} className="btn-secondary">
          Edit company
        </Link>
      </div>

      {/* Employees */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Employees{" "}
            <span className="text-slate-400">({company.employees.length})</span>
          </h2>
          <div className="flex items-center gap-3">
            {/* Attendance day picker */}
            <form method="get" className="flex items-center gap-2 text-sm">
              {open && <input type="hidden" name="open" value={open} />}
              <label className="text-slate-500" htmlFor="d">
                Attendance day
              </label>
              <input
                id="d"
                name="d"
                type="date"
                defaultValue={selStr}
                className="input py-1.5"
              />
              <button className="btn-secondary py-1.5" type="submit">
                Go
              </button>
            </form>
            <Link
              href={`/companies/${company.id}/employees/new`}
              className="btn-primary"
            >
              + Add employee
            </Link>
          </div>
        </div>

        {company.employees.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            No employees yet.
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 text-right font-medium">Salary</th>
                  <th className="px-3 py-3 text-right font-medium">Std days</th>
                  <th className="px-3 py-3 text-right font-medium">
                    Transport/day
                  </th>
                  <th className="px-3 py-3 font-medium">Loan balance</th>
                  <th className="px-3 py-3 text-right font-medium">
                    Absences ({monthLabel(selMonth, selYear)})
                  </th>
                  <th className="px-3 py-3 text-center font-medium">
                    {selStr}
                  </th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {company.employees.map((e) => {
                  const list = absences.filter((a) => a.employeeId === e.id);
                  const monthStates = new Map<number, DayState>();
                  for (const a of list) {
                    monthStates.set(
                      new Date(a.date).getUTCDate(),
                      a.paid ? "paid" : "unpaid"
                    );
                  }
                  const dayState: DayState =
                    monthStates.get(selDay) ?? "present";
                  const absentCount = absenceDays(list);
                  const isOpen = open === e.id;

                  const toggle = setAttendance.bind(null, companyId, e.id);
                  const saveLoan = setLoanBalance.bind(null, companyId, e.id);

                  return (
                    <Fragment key={e.id}>
                      <tr className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2">
                          <Link
                            href={`/companies/${company.id}/employees/${e.id}`}
                            className="font-medium text-brand-700 hover:underline"
                          >
                            {e.name}
                          </Link>
                          {e.employeeNo && (
                            <div className="text-xs text-slate-400">
                              No. {e.employeeNo}
                            </div>
                          )}
                          {!e.active && (
                            <div className="text-xs text-slate-400">
                              inactive
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {money(Number(e.baseSalary), cur)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {e.standardWorkDays}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {money(Number(e.dailyTransportRate), cur)}
                        </td>
                        <td className="px-3 py-2">
                          <form
                            action={saveLoan}
                            className="flex items-center gap-1"
                          >
                            <input
                              type="hidden"
                              name="returnTo"
                              value={currentUrl}
                            />
                            <input
                              name="loanBalance"
                              type="number"
                              step="0.01"
                              defaultValue={Number(e.loanBalance)}
                              className="input w-24 py-1 text-right"
                            />
                            <button
                              type="submit"
                              title="Save loan balance"
                              className="btn-secondary px-2 py-1"
                            >
                              ✓
                            </button>
                          </form>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {absentCount > 0 ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                              {num(absentCount)}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <form action={toggle} className="inline">
                            <input type="hidden" name="date" value={selStr} />
                            <input
                              type="hidden"
                              name="next"
                              value={NEXT_STATE[dayState]}
                            />
                            <input
                              type="hidden"
                              name="returnTo"
                              value={currentUrl}
                            />
                            <button
                              type="submit"
                              title={STATE_LABEL[dayState]}
                              className={`w-24 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium transition-colors ${STATE_CELL[dayState]}`}
                            >
                              {dayState === "present"
                                ? "Present"
                                : dayState === "unpaid"
                                  ? "Absent"
                                  : "Absent (paid)"}
                            </button>
                          </form>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Link
                            href={isOpen ? urlWith() : urlWith(e.id)}
                            className="text-sm text-slate-500 hover:underline"
                          >
                            {isOpen ? "Hide ▲" : "Calendar ▾"}
                          </Link>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="mb-2 text-sm font-medium">
                              {e.name} — {monthLabel(selMonth, selYear)}{" "}
                              attendance
                            </div>
                            <AttendanceCalendar
                              companyId={companyId}
                              employeeId={e.id}
                              year={selYear}
                              month={selMonth}
                              states={monthStates}
                              returnTo={currentUrl}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Monthly payroll — open the month, work it, then close it */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Monthly payroll</h2>
          <NewRunForm
            companyId={company.id}
            defaultMonth={curMonth}
            defaultYear={curYear}
          />
        </div>

        {/* Current month hero */}
        <div className="card mb-4 flex flex-wrap items-center justify-between gap-4 border-brand-100 bg-brand-50/40 p-5">
          <div>
            <div className="text-xs uppercase tracking-wide text-brand-700">
              This month
            </div>
            <div className="text-xl font-semibold">
              {monthLabel(curMonth, curYear)}
            </div>
            {currentRun ? (
              <p className="mt-1 text-sm text-slate-500">
                {currentRun.status === "finalized" ? (
                  <span className="text-green-700">
                    Closed — salaries handed out.
                  </span>
                ) : (
                  <span className="text-amber-700">
                    Open — review payslips, then close the month.
                  </span>
                )}
              </p>
            ) : (
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Opening the month creates a payslip for every active employee
                from their salary and this month&apos;s attendance. You review,
                then close it to hand out salaries.
              </p>
            )}
          </div>
          {currentRun ? (
            <Link
              href={`/companies/${company.id}/runs/${currentRun.id}`}
              className="btn-primary"
            >
              {currentRun.status === "finalized"
                ? "View month"
                : "Continue → close month"}
            </Link>
          ) : (
            <form action={createRun.bind(null, company.id)}>
              <input type="hidden" name="month" value={curMonth} />
              <input type="hidden" name="year" value={curYear} />
              <button type="submit" className="btn-primary">
                Open {monthLabel(curMonth, curYear)}
              </button>
            </form>
          )}
        </div>

        {/* All months */}
        {company.payrollRuns.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-500">
            No months opened yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {company.payrollRuns.map((r) => (
              <Link
                key={r.id}
                href={`/companies/${company.id}/runs/${r.id}`}
                className="card flex items-center justify-between p-4 hover:shadow-md"
              >
                <span className="font-medium">
                  {monthLabel(r.month, r.year)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    r.status === "finalized"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {r.status === "finalized" ? "Closed" : "Open"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
