import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveRunDraft, finalizeRun, deleteRun } from "@/lib/actions";
import { money } from "@/lib/format";
import { absenceDays } from "@/lib/payroll";
import { formatMonth, tf } from "@/lib/i18n";
import { getT } from "@/lib/i18n.server";
import { ConfirmButton } from "@/app/(app)/components/confirm-button";
import { PayslipEditor } from "./payslip-editor";
import { RunForm } from "./run-form";

export default async function RunPage({
  params,
}: {
  params: Promise<{ companyId: string; runId: string }>;
}) {
  const { companyId, runId } = await params;
  const { t, locale } = await getT();
  const backArrow = locale === "ar" ? "→" : "←";
  const run = await prisma.payrollRun.findFirst({
    where: { id: runId, companyId },
    include: {
      company: true,
      payslips: {
        include: { employee: true },
        orderBy: { employee: { name: "asc" } },
      },
    },
  });
  if (!run) notFound();

  // Absences recorded within this run's month, per employee.
  const monthStart = new Date(Date.UTC(run.year, run.month - 1, 1));
  const monthEnd = new Date(Date.UTC(run.year, run.month, 1));
  const absences = await prisma.absence.findMany({
    where: {
      employeeId: { in: run.payslips.map((p) => p.employeeId) },
      date: { gte: monthStart, lt: monthEnd },
    },
    select: { employeeId: true, kind: true, paid: true },
  });
  const absenceByEmployee = new Map<
    string,
    { days: number; unpaidDays: number }
  >();
  for (const p of run.payslips) {
    const list = absences.filter((a) => a.employeeId === p.employeeId);
    absenceByEmployee.set(p.employeeId, {
      days: absenceDays(list),
      unpaidDays: absenceDays(list.filter((a) => !a.paid)),
    });
  }

  const cur = run.company.currency;
  const locked = run.status === "finalized";

  const totalNet = run.payslips.reduce((s, p) => s + Number(p.netPay), 0);
  const saveDraft = saveRunDraft.bind(null, companyId, runId);
  const finalize = finalizeRun.bind(null, companyId, runId);
  const remove = deleteRun.bind(null, companyId, runId);
  const payslipIds = run.payslips.map((p) => p.id).join(",");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/companies/${companyId}`}
            className="text-sm text-slate-500 hover:underline"
          >
            {backArrow} {run.company.name}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            {tf(t.month.titleSuffix, {
              month: formatMonth(t, run.month, run.year),
            })}
          </h1>
          <p className="text-sm text-slate-500">
            {run.payslips.length} {t.month.employees} ·{" "}
            <span className={locked ? "text-green-700" : "text-amber-700"}>
              {locked ? t.monthly.closedBadge : t.monthly.openBadge}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-100 px-4 py-2 text-end">
            <div className="text-xs text-slate-500">{t.month.totalNet}</div>
            <div className="text-lg font-semibold">{money(totalNet, cur)}</div>
          </div>
          <Link
            href={`/companies/${companyId}/runs/${runId}/print`}
            className="btn-secondary"
          >
            {t.pdf.exportPdf}
          </Link>
          {!locked && (
            <form action={finalize}>
              <ConfirmButton
                className="btn-primary"
                confirm={t.month.confirmClose}
              >
                {t.month.closeMonth}
              </ConfirmButton>
            </form>
          )}
          <form action={remove}>
            <ConfirmButton
              className="btn-danger"
              confirm={t.month.confirmDelete}
            >
              {t.month.delete}
            </ConfirmButton>
          </form>
        </div>
      </div>

      {locked && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          {t.month.closedBanner}
        </div>
      )}

      {run.payslips.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          {t.month.noEmployees}
        </div>
      ) : (
        (() => {
          const editors = run.payslips.map((p) => (
            <PayslipEditor
              key={p.id}
              currency={cur}
              locked={locked}
              t={t.payslip}
              absence={
                absenceByEmployee.get(p.employeeId) ?? {
                  days: 0,
                  unpaidDays: 0,
                }
              }
              payslip={{
                id: p.id,
                employeeName: p.employee.name,
                employeeNo: p.employee.employeeNo,
                baseSalary: Number(p.baseSalary),
                dailyTransportRate: Number(p.dailyTransportRate),
                daysWorked: Number(p.daysWorked),
                familyAllowance: Number(p.familyAllowance),
                overtime: Number(p.overtime),
                salaryAdjAddition: Number(p.salaryAdjAddition),
                otherAdditions: Number(p.otherAdditions),
                nssfDeduction: Number(p.nssfDeduction),
                nssfDifference: Number(p.nssfDifference),
                absenceDeduction: Number(p.absenceDeduction),
                salaryAdjDeduction: Number(p.salaryAdjDeduction),
                purchases: Number(p.purchases),
                advance: Number(p.advance),
                loanPayment: Number(p.loanPayment),
                loanBalanceBefore: Number(p.loanBalanceBefore),
                netPay: Number(p.netPay),
              }}
            />
          ));

          return locked ? (
            <div className="space-y-4">{editors}</div>
          ) : (
            <RunForm
              action={saveDraft}
              payslipIds={payslipIds}
              currency={cur}
              labels={{
                saveDraft: t.month.saveDraft,
                saving: t.month.saving,
                draftNote: t.month.draftNote,
                toastSaved: t.month.toastSaved,
              }}
            >
              {editors}
            </RunForm>
          );
        })()
      )}
    </div>
  );
}
