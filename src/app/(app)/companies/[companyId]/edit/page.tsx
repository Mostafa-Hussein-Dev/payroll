import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCompany, deleteCompany } from "@/lib/actions";
import { CompanyForm } from "../../company-form";
import { ConfirmButton } from "@/app/(app)/components/confirm-button";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) notFound();

  const action = updateCompany.bind(null, companyId);
  const remove = deleteCompany.bind(null, companyId);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit company</h1>
      <CompanyForm
        action={action}
        company={{
          name: company.name,
          currency: company.currency,
          nssfMode: company.nssfMode,
          nssfValue: company.nssfValue.toString(),
          address: company.address,
        }}
        submitLabel="Save changes"
        cancelHref={`/companies/${companyId}`}
      />

      <div className="card border-red-100 p-6">
        <h2 className="font-medium text-red-600">Danger zone</h2>
        <p className="mb-3 mt-1 text-sm text-slate-500">
          Deleting a company removes all its employees, runs and payslips.
        </p>
        <form action={remove}>
          <ConfirmButton
            className="btn-danger"
            confirm="Delete this company and ALL its data?"
          >
            Delete company
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
