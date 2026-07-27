import { createEmployee } from "@/lib/actions";
import { EmployeeForm } from "../employee-form";

export default async function NewEmployeePage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const action = createEmployee.bind(null, companyId);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">New employee</h1>
      <EmployeeForm
        action={action}
        submitLabel="Add employee"
        cancelHref={`/companies/${companyId}`}
      />
    </div>
  );
}
