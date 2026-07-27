import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveRunDraft, finalizeRun, deleteRun } from "@/lib/actions";
import { money } from "@/lib/format";
import { monthLabel, absenceDays } from "@/lib/payroll";
import { ConfirmButton } from "@/app/(app)/components/confirm-button";
import { PayslipEditor } from "./payslip-editor";
import { RunForm } from "./run-form";

export default async function RunPage({
  params,
}: {
  params: Promise<{ companyId: string; runId: string }>;
}) {
  const { companyId, runId } = await params;
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
            ← {run.company.name}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            Payroll · {monthLabel(run.month, run.year)}
          </h1>
          <p className="text-sm text-slate-500">
            {run.payslips.length} payslips ·{" "}
            <span
              className={
                locked ? "text-green-700" : "text-amber-700"
              }
            >
              {run.status}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-100 px-4 py-2 text-right">
            <div className="text-xs text-slate-500">Total net</div>
            <div className="text-lg font-semibold">
              {money(totalNet, cur)}
            </div>
          </div>
          {!locked && (
            <form action={finalize}>
              <ConfirmButton
                className="btn-primary"
                confirm="Finalize this run? Loan payments will be applied to employee balances and the run will be locked."
              >
                Finalize
              </ConfirmButton>
            </form>
          )}
          <form action={remove}>
            <ConfirmButton className="btn-danger" confirm="Delete this run?">
              Delete
            </ConfirmButton>
          </form>
        </div>
      </div>

      {locked && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          This run is finalized and read-only. Loan payments have been applied
          to employee loan balances.
        </div>
      )}

      {run.payslips.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          No active employees existed when this run was created.
        </div>
      ) : (
        (() => {
          const editors = run.payslips.map((p) => (
            <PayslipEditor
              key={p.id}
              currency={cur}
              locked={locked}
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
                transportAllowance: Number(p.transportAllowance),
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
            <RunForm action={saveDraft} payslipIds={payslipIds} currency={cur}>
              {editors}
            </RunForm>
          );
        })()
      )}
    </div>
  );
}
