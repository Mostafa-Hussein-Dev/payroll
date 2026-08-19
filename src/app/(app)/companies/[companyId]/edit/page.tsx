import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCompany, deleteCompany } from "@/lib/actions";
import { getT } from "@/lib/i18n.server";
import { CompanyForm } from "../../company-form";
import { ConfirmButton } from "@/app/(app)/components/confirm-button";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { t } = await getT();
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) notFound();

  const action = updateCompany.bind(null, companyId);
  const remove = deleteCompany.bind(null, companyId);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">{t.company.editCompany}</h1>
      <CompanyForm
        action={action}
        company={{
          name: company.name,
          currency: company.currency,
          nssfMode: company.nssfMode,
          nssfValue: company.nssfValue.toString(),
          address: company.address,
        }}
        submitLabel={t.common.saveChanges}
        cancelHref={`/companies/${companyId}`}
        t={t}
      />

      <div className="card border-red-100 p-6">
        <h2 className="font-medium text-red-600">{t.common.dangerZone}</h2>
        <p className="mb-3 mt-1 text-sm text-slate-500">
          {t.company.deleteDesc}
        </p>
        <form action={remove}>
          <ConfirmButton className="btn-danger" confirm={t.company.confirmDelete}>
            {t.company.deleteCompany}
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
