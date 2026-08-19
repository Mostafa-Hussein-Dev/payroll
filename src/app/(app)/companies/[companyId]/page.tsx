import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setAttendance, setLoanBalance, createRun } from "@/lib/actions";
import { money, num } from "@/lib/format";
import { absenceDays } from "@/lib/payroll";
import { formatMonth } from "@/lib/i18n";
import { getT } from "@/lib/i18n.server";
import { DayState, NEXT_STATE, STATE_CELL, pad2 } from "@/lib/attendance";
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
  const { t, locale } = await getT();
  const backArrow = locale === "ar" ? "→" : "←";

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

  const calLabels = {
    present: t.attendance.legendPresent,
    unpaid: t.attendance.legendUnpaid,
    paid: t.attendance.legendPaid,
    clickDay: t.attendance.clickDay,
    save: t.attendance.save,
    saving: t.attendance.saving,
    saved: t.attendance.saved,
    unsaved: t.attendance.unsaved,
  };
  const dayLabel = (s: DayState) =>
    s === "present"
      ? t.employees.present
      : s === "unpaid"
        ? t.employees.absent
        : t.employees.absentPaid;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:underline">
            {backArrow} {t.dashboard.companies}
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
          {t.company.editCompany}
        </Link>
      </div>

      {/* Employees */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {t.employees.title}{" "}
            <span className="text-slate-400">({company.employees.length})</span>
          </h2>
          <div className="flex items-center gap-3">
            {/* Attendance day picker */}
            <form method="get" className="flex items-center gap-2 text-sm">
              {open && <input type="hidden" name="open" value={open} />}
              <label className="text-slate-500" htmlFor="d">
                {t.employees.attendanceDay}
              </label>
              <input
                id="d"
                name="d"
                type="date"
                defaultValue={selStr}
                className="input py-1.5"
              />
              <button className="btn-secondary py-1.5" type="submit">
                {t.employees.go}
              </button>
            </form>
            <Link
              href={`/companies/${company.id}/employees/new`}
              className="btn-primary"
            >
              {t.employees.add}
            </Link>
          </div>
        </div>

        {company.employees.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            {t.employees.none}
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-start text-slate-500">
                <tr>
                  <th className="px-3 py-3 text-start font-medium">
                    {t.employees.colName}
                  </th>
                  <th className="px-3 py-3 text-end font-medium">
                    {t.employees.colSalary}
                  </th>
                  <th className="px-3 py-3 text-end font-medium">
                    {t.employees.colStdDays}
                  </th>
                  <th className="px-3 py-3 text-end font-medium">
                    {t.employees.colTransportDay}
                  </th>
                  <th className="px-3 py-3 text-start font-medium">
                    {t.employees.colLoan}
                  </th>
                  <th className="px-3 py-3 text-end font-medium">
                    {t.employees.colAbsences} (
                    {formatMonth(t, selMonth, selYear)})
                  </th>
                  <th className="px-3 py-3 text-center font-medium">{selStr}</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {company.employees.map((e) => {
                  const list = absences.filter((a) => a.employeeId === e.id);
                  const monthStates: Record<number, DayState> = {};
                  for (const a of list) {
                    monthStates[new Date(a.date).getUTCDate()] = a.paid
                      ? "paid"
                      : "unpaid";
                  }
                  const dayState: DayState = monthStates[selDay] ?? "present";
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
                              #{e.employeeNo}
                            </div>
                          )}
                          {!e.active && (
                            <div className="text-xs text-slate-400">
                              {t.employees.inactive}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-end">
                          {money(Number(e.baseSalary), cur)}
                        </td>
                        <td className="px-3 py-2 text-end">
                          {e.standardWorkDays}
                        </td>
                        <td className="px-3 py-2 text-end">
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
                              className="input w-24 py-1 text-end"
                            />
                            <button
                              type="submit"
                              title={t.employees.saveLoan}
                              className="btn-secondary px-2 py-1"
                            >
                              ✓
                            </button>
                          </form>
                        </td>
                        <td className="px-3 py-2 text-end">
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
                              title={dayLabel(dayState)}
                              className={`w-24 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium transition-colors ${STATE_CELL[dayState]}`}
                            >
                              {dayLabel(dayState)}
                            </button>
                          </form>
                        </td>
                        <td className="px-3 py-2 text-end">
                          <Link
                            href={isOpen ? urlWith() : urlWith(e.id)}
                            className="text-sm text-slate-500 hover:underline"
                          >
                            {isOpen ? t.employees.hide : t.employees.calendar}
                          </Link>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="mb-2 text-sm font-medium">
                              {e.name} — {formatMonth(t, selMonth, selYear)}{" "}
                              {t.employees.attendanceSuffix}
                            </div>
                            <AttendanceCalendar
                              companyId={companyId}
                              employeeId={e.id}
                              year={selYear}
                              month={selMonth}
                              initial={monthStates}
                              labels={calLabels}
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
          <h2 className="text-lg font-semibold">{t.monthly.title}</h2>
          <NewRunForm
            companyId={company.id}
            defaultMonth={curMonth}
            defaultYear={curYear}
            labels={{
              openAnother: t.monthly.openAnother,
              month: t.monthly.month,
              year: t.monthly.year,
              openMonthBtn: t.monthly.openMonthBtn,
              cancel: t.common.cancel,
              months: t.months,
            }}
          />
        </div>

        {/* Current month hero */}
        <div className="card mb-4 flex flex-wrap items-center justify-between gap-4 border-brand-100 bg-brand-50/40 p-5">
          <div>
            <div className="text-xs uppercase tracking-wide text-brand-700">
              {t.monthly.thisMonth}
            </div>
            <div className="text-xl font-semibold">
              {formatMonth(t, curMonth, curYear)}
            </div>
            {currentRun ? (
              <p className="mt-1 text-sm text-slate-500">
                {currentRun.status === "finalized" ? (
                  <span className="text-green-700">
                    {t.monthly.closedHandedOut}
                  </span>
                ) : (
                  <span className="text-amber-700">
                    {t.monthly.openReview}
                  </span>
                )}
              </p>
            ) : (
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {t.monthly.openingCreates}
              </p>
            )}
          </div>
          {currentRun ? (
            <Link
              href={`/companies/${company.id}/runs/${currentRun.id}`}
              className="btn-primary"
            >
              {currentRun.status === "finalized"
                ? t.monthly.viewMonth
                : t.monthly.continueClose}
            </Link>
          ) : (
            <form action={createRun.bind(null, company.id)}>
              <input type="hidden" name="month" value={curMonth} />
              <input type="hidden" name="year" value={curYear} />
              <button type="submit" className="btn-primary">
                {t.monthly.open} {formatMonth(t, curMonth, curYear)}
              </button>
            </form>
          )}
        </div>

        {/* All months */}
        {company.payrollRuns.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-500">
            {t.monthly.noMonths}
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
                  {formatMonth(t, r.month, r.year)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    r.status === "finalized"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {r.status === "finalized"
                    ? t.monthly.closedBadge
                    : t.monthly.openBadge}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
