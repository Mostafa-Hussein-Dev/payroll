import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { formatMonth, tf } from "@/lib/i18n";
import { getT } from "@/lib/i18n.server";
import { PrintButton } from "./print-button";

function r2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export default async function RunPrintPage({
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

  const cur = run.company.currency;
  const monthTitle = tf(t.month.titleSuffix, {
    month: formatMonth(t, run.month, run.year),
  });
  const generated = new Date().toLocaleDateString(
    locale === "ar" ? "ar" : "en-GB"
  );

  const rows = run.payslips.map((p) => {
    const salary = Number(p.baseSalary);
    const transport = Number(p.transportAllowance);
    const family = Number(p.familyAllowance);
    const additions =
      Number(p.overtime) +
      Number(p.salaryAdjAddition) +
      Number(p.otherAdditions);
    const gross = r2(salary + transport + family + additions);
    const nssf = Number(p.nssfDeduction);
    const absence = Number(p.absenceDeduction);
    const otherDed =
      Number(p.nssfDifference) +
      Number(p.salaryAdjDeduction) +
      Number(p.purchases) +
      Number(p.advance) +
      Number(p.loanPayment);
    const totalDed = r2(nssf + absence + otherDed);
    const net = Number(p.netPay);
    return {
      p,
      salary,
      transport,
      family,
      additions,
      gross,
      nssf,
      absence,
      otherDed,
      totalDed,
      net,
    };
  });

  const grandNet = r2(rows.reduce((s, r) => s + r.net, 0));
  const grandGross = r2(rows.reduce((s, r) => s + r.gross, 0));

  const th = "border border-slate-400 px-2 py-1 text-start font-semibold";
  const thNum = "border border-slate-400 px-2 py-1 text-end font-semibold";
  const td = "border border-slate-300 px-2 py-1";
  const tdNum = "border border-slate-300 px-2 py-1 text-end";

  return (
    <div className="space-y-6">
      {/* Toolbar (hidden when printing) */}
      <div className="no-print flex items-center justify-between">
        <Link
          href={`/companies/${companyId}/runs/${runId}`}
          className="text-sm text-slate-500 hover:underline"
        >
          {backArrow} {monthTitle}
        </Link>
        <PrintButton label={t.pdf.print} />
      </div>

      {/* ---------- Page 1: summary sheet ---------- */}
      <section className="print-avoid-break">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold">{run.company.name}</h1>
            <div className="text-sm text-slate-600">{monthTitle}</div>
          </div>
          <div className="text-xs text-slate-500">
            {t.pdf.generated}: {generated}
          </div>
        </div>

        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100">
              <th className={th}>#</th>
              <th className={th}>{t.employees.colName}</th>
              <th className={thNum}>{t.payslip.salary}</th>
              <th className={thNum}>{t.employees.colTransportDay}</th>
              <th className={thNum}>{t.payslip.family}</th>
              <th className={thNum}>{t.pdf.additions}</th>
              <th className={thNum}>{t.pdf.gross}</th>
              <th className={thNum}>{t.payslip.nssf}</th>
              <th className={thNum}>{t.payslip.absence}</th>
              <th className={thNum}>{t.pdf.deductionsTotal}</th>
              <th className={thNum}>{t.payslip.netDue}</th>
              <th className={th} style={{ width: "18%" }}>
                {t.pdf.received}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.p.id}>
                <td className={td}>{i + 1}</td>
                <td className={td}>
                  {r.p.employee.name}
                  {r.p.employee.employeeNo ? (
                    <span className="text-slate-400"> #{r.p.employee.employeeNo}</span>
                  ) : null}
                </td>
                <td className={tdNum}>{money(r.salary, cur)}</td>
                <td className={tdNum}>{money(r.transport, cur)}</td>
                <td className={tdNum}>{money(r.family, cur)}</td>
                <td className={tdNum}>{money(r.additions, cur)}</td>
                <td className={tdNum}>{money(r.gross, cur)}</td>
                <td className={tdNum}>{money(r.nssf, cur)}</td>
                <td className={tdNum}>{money(r.absence, cur)}</td>
                <td className={tdNum}>{money(r.totalDed, cur)}</td>
                <td className={`${tdNum} font-semibold`}>{money(r.net, cur)}</td>
                <td className={td}></td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-semibold">
              <td className={td} colSpan={6}>
                {t.pdf.grandTotal}
              </td>
              <td className={tdNum}>{money(grandGross, cur)}</td>
              <td className={td} colSpan={3}></td>
              <td className={tdNum}>{money(grandNet, cur)}</td>
              <td className={td}></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ---------- One payslip page per employee ---------- */}
      {rows.map((r) => {
        const e = r.p.employee;
        const transport = r.transport;
        const earnings: [string, number][] = [
          [t.payslip.salary, r.salary],
          [t.payslip.dailyTransport, transport],
          [t.payslip.family, r.family],
          [t.payslip.overtime, Number(r.p.overtime)],
          [t.payslip.salaryAdjPlus, Number(r.p.salaryAdjAddition)],
          [t.payslip.otherPlus, Number(r.p.otherAdditions)],
        ];
        const deductions: [string, number][] = [
          [t.payslip.nssf, r.nssf],
          [t.payslip.nssfDiff, Number(r.p.nssfDifference)],
          [t.payslip.absence, r.absence],
          [t.payslip.salaryAdjMinus, Number(r.p.salaryAdjDeduction)],
          [t.payslip.purchases, Number(r.p.purchases)],
          [t.payslip.advance, Number(r.p.advance)],
          [t.payslip.loanPayment, Number(r.p.loanPayment)],
        ];
        return (
          <section
            key={r.p.id}
            className="page-break print-avoid-break pt-2"
          >
            <div className="mb-4 flex items-end justify-between border-b border-slate-300 pb-2">
              <div>
                <div className="text-lg font-bold">{run.company.name}</div>
                <div className="text-sm text-slate-600">
                  {t.pdf.payslipTitle} · {monthTitle}
                </div>
              </div>
              <div className="text-end text-sm">
                <div className="font-semibold">{e.name}</div>
                {e.employeeNo && (
                  <div className="text-slate-500">#{e.employeeNo}</div>
                )}
              </div>
            </div>

            {/* meta */}
            <div className="mb-4 grid grid-cols-3 gap-3 text-xs text-slate-600">
              <div>
                {t.pdf.standardDays}: <strong>{r.p.standardWorkDays}</strong>
              </div>
              <div>
                {t.pdf.daysWorked}: <strong>{Number(r.p.daysWorked)}</strong>
              </div>
              <div>
                {t.pdf.startDate}:{" "}
                <strong>
                  {e.startDate
                    ? new Date(e.startDate).toLocaleDateString(
                        locale === "ar" ? "ar" : "en-GB"
                      )
                    : "—"}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Earnings */}
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={th} colSpan={2}>
                      {t.payslip.earnings}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map(([label, val]) => (
                    <tr key={label}>
                      <td className={td}>{label}</td>
                      <td className={tdNum}>{money(val, cur)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className={td}>{t.payslip.totalEarnings}</td>
                    <td className={tdNum}>{money(r.gross, cur)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Deductions */}
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={th} colSpan={2}>
                      {t.payslip.deductions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deductions.map(([label, val]) => (
                    <tr key={label}>
                      <td className={td}>{label}</td>
                      <td className={tdNum}>{money(val, cur)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className={td}>{t.payslip.totalDeductions}</td>
                    <td className={tdNum}>{money(r.totalDed, cur)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Net + loan */}
            <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-300 px-4 py-3">
              <div className="text-sm text-slate-600">
                {t.payslip.loan}: {money(Number(r.p.loanBalanceBefore), cur)} →{" "}
                {money(
                  r2(Number(r.p.loanBalanceBefore) - Number(r.p.loanPayment)),
                  cur
                )}
              </div>
              <div className="text-end">
                <div className="text-xs text-slate-500">{t.payslip.netDue}</div>
                <div className="text-2xl font-bold">{money(r.net, cur)}</div>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-12 grid grid-cols-2 gap-10">
              <div>
                <div className="border-t border-slate-500 pt-1 text-sm">
                  {t.pdf.employeeSignature}
                </div>
              </div>
              <div>
                <div className="border-t border-slate-500 pt-1 text-sm">
                  {t.pdf.managerSignature}
                </div>
              </div>
            </div>
            <div className="mt-6 text-xs text-slate-500">
              {t.pdf.date}: ____ / ____ / ________
            </div>
          </section>
        );
      })}
    </div>
  );
}
