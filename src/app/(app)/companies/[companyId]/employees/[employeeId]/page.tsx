import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateEmployee, deleteEmployee } from "@/lib/actions";
import { absenceDays, dailyWage } from "@/lib/payroll";
import { formatMonth, tf } from "@/lib/i18n";
import { getT } from "@/lib/i18n.server";
import { money, num } from "@/lib/format";
import { EmployeeForm } from "../employee-form";
import { ConfirmButton } from "@/app/(app)/components/confirm-button";
import { AttendanceCalendar } from "./attendance-calendar";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default async function EditEmployeePage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string; employeeId: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { companyId, employeeId } = await params;
  const { m } = await searchParams;
  const { t, locale } = await getT();
  const backArrow = locale === "ar" ? "→" : "←";

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
    include: { company: true },
  });
  if (!employee) notFound();

  const cur = employee.company.currency;

  // Selected month (YYYY-MM), defaulting to the current month.
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1; // 1-12
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split("-").map(Number);
    if (mo >= 1 && mo <= 12) {
      year = y;
      month = mo;
    }
  }
  const ym = `${year}-${pad(month)}`;
  const prevYm = month === 1 ? `${year - 1}-12` : `${year}-${pad(month - 1)}`;
  const nextYm = month === 12 ? `${year + 1}-01` : `${year}-${pad(month + 1)}`;
  const base = `/companies/${companyId}/employees/${employeeId}`;
  const returnTo = `${base}?m=${ym}`;

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));
  const monthAbsences = await prisma.absence.findMany({
    where: { employeeId, date: { gte: monthStart, lt: monthEnd } },
  });

  const states = new Map<number, "present" | "unpaid" | "paid">();
  for (const a of monthAbsences) {
    const day = new Date(a.date).getUTCDate();
    states.set(day, a.paid ? "paid" : "unpaid");
  }

  const absentDays = absenceDays(monthAbsences);
  const unpaidDays = absenceDays(monthAbsences.filter((a) => !a.paid));
  const presentDays = Math.max(0, employee.standardWorkDays - absentDays);
  const wage = dailyWage(Number(employee.baseSalary), employee.standardWorkDays);
  const unpaidAmount = Math.round(unpaidDays * wage * 100) / 100;

  const action = updateEmployee.bind(null, companyId, employeeId);
  const remove = deleteEmployee.bind(null, companyId, employeeId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/companies/${companyId}`} className="text-sm text-slate-500 hover:underline">
          {backArrow} {employee.company.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{employee.name}</h1>
      </div>

      <EmployeeForm
        action={action}
        employee={{
          name: employee.name,
          employeeNo: employee.employeeNo,
          baseSalary: employee.baseSalary.toString(),
          standardWorkDays: employee.standardWorkDays,
          dailyTransportRate: employee.dailyTransportRate.toString(),
          familyAllowance: employee.familyAllowance.toString(),
          loanBalance: employee.loanBalance.toString(),
          nssfSubscribed: employee.nssfSubscribed,
          active: employee.active,
          startDate: employee.startDate,
        }}
        submitLabel={t.common.saveChanges}
        cancelHref={`/companies/${companyId}`}
        showActive
        t={t}
      />

      {/* Daily attendance */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.attendance.title}</h2>
          <div className="flex items-center gap-2 text-sm">
            <Link href={`${base}?m=${prevYm}`} className="btn-secondary py-1">
              ‹
            </Link>
            <span className="min-w-[7.5rem] text-center font-medium">
              {formatMonth(t, month, year)}
            </span>
            <Link href={`${base}?m=${nextYm}`} className="btn-secondary py-1">
              ›
            </Link>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label={t.attendance.present}
            value={num(presentDays)}
            sub={tf(t.attendance.ofStd, { n: employee.standardWorkDays })}
          />
          <Stat label={t.attendance.absent} value={num(absentDays)} tone="amber" />
          <Stat
            label={t.attendance.unpaidAbsent}
            value={num(unpaidDays)}
            tone="red"
          />
          <Stat
            label={t.attendance.unpaidAmount}
            value={money(unpaidAmount, cur)}
            sub={tf(t.attendance.perDay, { wage: money(wage, cur) })}
            tone="red"
          />
        </div>

        <AttendanceCalendar
          companyId={companyId}
          employeeId={employeeId}
          year={year}
          month={month}
          states={states}
          returnTo={returnTo}
          labels={{
            present: t.attendance.legendPresent,
            unpaid: t.attendance.legendUnpaid,
            paid: t.attendance.legendPaid,
            clickDay: t.attendance.clickDay,
          }}
        />

        <p className="mt-4 text-xs text-slate-400">{t.attendance.autoNote}</p>
      </div>

      <div className="card border-red-100 p-6">
        <h2 className="font-medium text-red-600">{t.common.dangerZone}</h2>
        <p className="mb-3 mt-1 text-sm text-slate-500">{t.employee.deleteDesc}</p>
        <form action={remove}>
          <ConfirmButton
            className="btn-danger"
            confirm={t.employee.confirmDelete}
          >
            {t.employee.deleteEmployee}
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "slate",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "slate" | "amber" | "red";
}) {
  const color =
    tone === "red"
      ? "text-red-600"
      : tone === "amber"
        ? "text-amber-600"
        : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
