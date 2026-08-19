import Link from "next/link";
import { Dict } from "@/lib/i18n";

type EmployeeValues = {
  name?: string;
  employeeNo?: string | null;
  baseSalary?: string | number;
  standardWorkDays?: string | number;
  dailyTransportRate?: string | number;
  familyAllowance?: string | number;
  loanBalance?: string | number;
  nssfSubscribed?: boolean;
  active?: boolean;
  startDate?: Date | null;
};

function dateInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function EmployeeForm({
  action,
  employee,
  submitLabel,
  cancelHref,
  showActive = false,
  t,
}: {
  action: (form: FormData) => void;
  employee?: EmployeeValues;
  submitLabel: string;
  cancelHref: string;
  showActive?: boolean;
  t: Dict;
}) {
  const e = t.employee;
  return (
    <form action={action} className="card space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">
            {e.name}
          </label>
          <input
            id="name"
            name="name"
            className="input"
            defaultValue={employee?.name}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="employeeNo">
            {e.employeeNo}
          </label>
          <input
            id="employeeNo"
            name="employeeNo"
            className="input"
            defaultValue={employee?.employeeNo ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="baseSalary">
            {e.baseSalary}
          </label>
          <input
            id="baseSalary"
            name="baseSalary"
            type="number"
            step="0.01"
            className="input"
            defaultValue={employee?.baseSalary?.toString() ?? "0"}
          />
        </div>
        <div>
          <label className="label" htmlFor="dailyTransportRate">
            {e.dailyTransport}
          </label>
          <input
            id="dailyTransportRate"
            name="dailyTransportRate"
            type="number"
            step="0.01"
            className="input"
            defaultValue={employee?.dailyTransportRate?.toString() ?? "0"}
          />
        </div>
        <div>
          <label className="label" htmlFor="familyAllowance">
            {e.family}
          </label>
          <input
            id="familyAllowance"
            name="familyAllowance"
            type="number"
            step="0.01"
            className="input"
            defaultValue={employee?.familyAllowance?.toString() ?? "0"}
          />
        </div>
        <div>
          <label className="label" htmlFor="standardWorkDays">
            {e.stdWorkDays}
          </label>
          <input
            id="standardWorkDays"
            name="standardWorkDays"
            type="number"
            step="1"
            min="1"
            className="input"
            defaultValue={employee?.standardWorkDays?.toString() ?? "30"}
          />
          <p className="mt-1 text-xs text-slate-400">{e.dailyWageHelp}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="loanBalance">
            {e.loanBalance}
          </label>
          <input
            id="loanBalance"
            name="loanBalance"
            type="number"
            step="0.01"
            className="input"
            defaultValue={employee?.loanBalance?.toString() ?? "0"}
          />
        </div>
        <div>
          <label className="label" htmlFor="startDate">
            {e.startDate}
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            className="input"
            defaultValue={dateInput(employee?.startDate)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 pt-1">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="nssfSubscribed"
            defaultChecked={employee?.nssfSubscribed ?? true}
            className="h-4 w-4"
          />
          {e.subscribedNssf}
        </label>
        {showActive && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={employee?.active ?? true}
              className="h-4 w-4"
            />
            {e.active}
          </label>
        )}
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
