import { createCompany } from "@/lib/actions";
import { CompanyForm } from "../company-form";

export default function NewCompanyPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold">New company</h1>
      <CompanyForm
        action={createCompany}
        submitLabel="Create company"
        cancelHref="/"
      />
    </div>
  );
}
