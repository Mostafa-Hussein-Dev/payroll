import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { employees: true, payrollRuns: true } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Companies</h1>
          <p className="text-sm text-slate-500">
            Manage payroll for each company separately.
          </p>
        </div>
        <Link href="/companies/new" className="btn-primary">
          + New company
        </Link>
      </div>

      {companies.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          No companies yet.{" "}
          <Link href="/companies/new" className="text-brand-600 underline">
            Create your first company
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Link
              key={c.id}
              href={`/companies/${c.id}`}
              className="card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{c.name}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {c.currency}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {c._count.employees} employees · {c._count.payrollRuns} months
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
