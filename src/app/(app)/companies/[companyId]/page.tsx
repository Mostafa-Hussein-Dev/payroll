import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { monthLabel } from "@/lib/payroll";
import { NewRunForm } from "./new-run-form";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      employees: { orderBy: { name: "asc" } },
      payrollRuns: { orderBy: [{ year: "desc" }, { month: "desc" }] },
    },
  });
  if (!company) notFound();

  const cur = company.currency;

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
        <Link
          href={`/companies/${company.id}/edit`}
          className="btn-secondary"
        >
          Edit company
        </Link>
      </div>

      {/* Employees */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Employees{" "}
            <span className="text-slate-400">({company.employees.length})</span>
          </h2>
          <Link
            href={`/companies/${company.id}/employees/new`}
            className="btn-primary"
          >
            + Add employee
          </Link>
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
                  <th className="px-4 py-3 font-medium">No.</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 text-right font-medium">Base salary</th>
                  <th className="px-4 py-3 text-right font-medium">Loan balance</th>
                  <th className="px-4 py-3 font-medium">NSSF</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {company.employees.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3 text-slate-500">
                      {e.employeeNo ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">{e.name}</td>
                    <td className="px-4 py-3 text-right">
                      {money(Number(e.baseSalary), cur)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {money(Number(e.loanBalance), cur)}
                    </td>
                    <td className="px-4 py-3">
                      {e.nssfSubscribed ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3">
                      {e.active ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/companies/${company.id}/employees/${e.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payroll runs */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Payroll runs{" "}
            <span className="text-slate-400">
              ({company.payrollRuns.length})
            </span>
          </h2>
          <NewRunForm companyId={company.id} />
        </div>

        {company.payrollRuns.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            No payroll runs yet. Create one to generate payslips for all active
            employees.
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
                  {r.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
