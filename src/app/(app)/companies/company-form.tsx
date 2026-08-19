import Link from "next/link";
import { Dict } from "@/lib/i18n";
import { NssfField } from "./nssf-field";

type CompanyValues = {
  name?: string;
  currency?: string;
  nssfMode?: string;
  nssfValue?: string | number;
  address?: string | null;
};

export function CompanyForm({
  action,
  company,
  submitLabel,
  cancelHref,
  t,
}: {
  action: (form: FormData) => void;
  company?: CompanyValues;
  submitLabel: string;
  cancelHref: string;
  t: Dict;
}) {
  return (
    <form action={action} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="name">
          {t.company.name}
        </label>
        <input
          id="name"
          name="name"
          className="input"
          defaultValue={company?.name}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="currency">
            {t.company.currency}
          </label>
          <input
            id="currency"
            name="currency"
            className="input"
            placeholder="USD"
            defaultValue={company?.currency ?? "USD"}
          />
        </div>
        <NssfField
          mode={company?.nssfMode ?? "percent"}
          value={company?.nssfValue?.toString() ?? "0"}
          labels={{
            label: t.company.nssfLabel,
            percentage: t.company.percentage,
            fixedAmount: t.company.fixedAmount,
            helpPercent: t.company.nssfHelpPercent,
            helpAmount: t.company.nssfHelpAmount,
            helpTail: t.company.nssfHelpTail,
          }}
        />
      </div>

      <div>
        <label className="label" htmlFor="address">
          {t.company.address}
        </label>
        <input
          id="address"
          name="address"
          className="input"
          defaultValue={company?.address ?? ""}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
        <Link href={cancelHref} className="btn-secondary">
          {t.common.cancel}
        </Link>
      </div>
    </form>
  );
}
