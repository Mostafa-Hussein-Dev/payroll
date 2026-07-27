import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateEmployee, deleteEmployee } from "@/lib/actions";
import { EmployeeForm } from "../employee-form";
import { ConfirmButton } from "@/app/(app)/components/confirm-button";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ companyId: string; employeeId: string }>;
}) {
  const { companyId, employeeId } = await params;
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
  });
  if (!employee) notFound();

  const action = updateEmployee.bind(null, companyId, employeeId);
  const remove = deleteEmployee.bind(null, companyId, employeeId);

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

      <div className="card border-red-100 p-6">
        <h2 className="font-medium text-red-600">Danger zone</h2>
        <p className="mb-3 mt-1 text-sm text-slate-500">
          Deleting an employee removes their payslips from all runs.
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
