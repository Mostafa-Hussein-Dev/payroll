import { createCompany } from "@/lib/actions";
import { getT } from "@/lib/i18n.server";
import { CompanyForm } from "../company-form";

export default async function NewCompanyPage() {
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold">{t.company.newCompany}</h1>
      <CompanyForm
        action={createCompany}
        submitLabel={t.company.createCompany}
        cancelHref="/"
        t={t}
      />
    </div>
  );
}
