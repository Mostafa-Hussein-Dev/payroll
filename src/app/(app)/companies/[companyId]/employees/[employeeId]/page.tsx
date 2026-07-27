import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  updateEmployee,
  deleteEmployee,
  addAbsence,
  deleteAbsence,
} from "@/lib/actions";
import { absenceDays } from "@/lib/payroll";
import { EmployeeForm } from "../employee-form";
import { ConfirmButton } from "@/app/(app)/components/confirm-button";
import { AddAbsenceForm } from "./add-absence-form";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ companyId: string; employeeId: string }>;
}) {
  const { companyId, employeeId } = await params;
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
    include: { absences: { orderBy: { date: "desc" } } },
  });
  if (!employee) notFound();

  const action = updateEmployee.bind(null, companyId, employeeId);
  const remove = deleteEmployee.bind(null, companyId, employeeId);
  const add = addAbsence.bind(null, companyId, employeeId);

  const totalDays = absenceDays(employee.absences);
  const unpaidDays = absenceDays(employee.absences.filter((a) => !a.paid));

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{employee.name}</h1>
      <EmployeeForm
        action={action}
        employee={{
          name: employee.name,
          employeeNo: employee.employeeNo,
          baseSalary: employee.baseSalary.toString(),
          transportAllowance: employee.transportAllowance.toString(),
          familyAllowance: employee.familyAllowance.toString(),
          loanBalance: employee.loanBalance.toString(),
          nssfSubscribed: employee.nssfSubscribed,
          active: employee.active,
          startDate: employee.startDate,
        }}
        submitLabel="Save changes"
        cancelHref={`/companies/${companyId}`}
        showActive
      />

      {/* Attendance / absences (غياب) */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Absences (غياب)</h2>
          <div className="text-right text-sm">
            <span className="font-semibold">{totalDays}</span> day
            {totalDays === 1 ? "" : "s"} total
            <span className="text-slate-400"> · </span>
            <span className="font-semibold text-red-600">{unpaidDays}</span>{" "}
            unpaid
          </div>
        </div>

        <AddAbsenceForm action={add} />

        {employee.absences.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No absences recorded yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Reason</th>
                  <th className="py-2 pr-3 font-medium">Paid</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {employee.absences.map((a) => {
                  const del = deleteAbsence.bind(
                    null,
                    companyId,
                    employeeId,
                    a.id
                  );
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-2 pr-3">{fmt(a.date)}</td>
                      <td className="py-2 pr-3">
                        {a.kind === "half" ? "Half day" : "Full day"}
                      </td>
                      <td className="py-2 pr-3 text-slate-500">
                        {a.reason || "—"}
                      </td>
                      <td className="py-2 pr-3">
                        {a.paid ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            Paid
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <form action={del}>
                          <ConfirmButton
                            className="text-red-600 hover:underline"
                            confirm="Remove this absence?"
                          >
                            Remove
                          </ConfirmButton>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card border-red-100 p-6">
        <h2 className="font-medium text-red-600">Danger zone</h2>
        <p className="mb-3 mt-1 text-sm text-slate-500">
          Deleting an employee removes their payslips and absences.
        </p>
        <form action={remove}>
          <ConfirmButton
            className="btn-danger"
            confirm="Delete this employee and all their payslips?"
          >
            Delete employee
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
