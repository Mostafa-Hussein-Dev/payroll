import Link from "next/link";

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
}: {
  action: (form: FormData) => void;
  employee?: EmployeeValues;
  submitLabel: string;
  cancelHref: string;
  showActive?: boolean;
}) {
  return (
    <form action={action} className="card space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">
            Name
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
            Employee no. (رقم المساعد)
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
            Base salary (الراتب)
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
            Daily transport (بدل نقل يومي)
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
            Family (تعويض عائلي)
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
            Standard work days (أيام العمل الأساسية)
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
          <p className="mt-1 text-xs text-slate-400">
            Daily wage = base salary ÷ standard work days.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="loanBalance">
            Loan balance (رصيد القرض)
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
            Start date (بداية عمل)
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
          Subscribed to NSSF (الضمان)
        </label>
        {showActive && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={employee?.active ?? true}
              className="h-4 w-4"
            />
            Active
          </label>
        )}
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
