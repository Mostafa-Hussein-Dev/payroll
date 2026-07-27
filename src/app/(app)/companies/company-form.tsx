import Link from "next/link";
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
}: {
  action: (form: FormData) => void;
  company?: CompanyValues;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="name">
          Company name
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
            Currency
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
        />
      </div>

      <div>
        <label className="label" htmlFor="address">
          Address (optional)
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
          Cancel
        </Link>
      </div>
    </form>
  );
}
