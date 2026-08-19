"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { requireUser } from "./auth";
import {
  PayslipAmounts,
  netPay,
  round2,
  computeNssf,
  transportAllowance,
  dailyWage,
  absenceDays,
  INPUT_FIELDS,
} from "./payroll";

function n(form: FormData, key: string): number {
  const v = form.get(key);
  const parsed = typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(parsed) ? round2(parsed) : 0;
}

function s(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function int(form: FormData, key: string, fallback: number): number {
  const v = form.get(key);
  const parsed = typeof v === "string" ? parseInt(v, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// ---------- Companies ----------

export async function createCompany(form: FormData) {
  await requireUser();
  const name = s(form, "name");
  if (!name) throw new Error("Company name is required");
  const company = await prisma.company.create({
    data: {
      name,
      currency: s(form, "currency") || "USD",
      nssfMode: s(form, "nssfMode") === "amount" ? "amount" : "percent",
      nssfValue: n(form, "nssfValue").toString(),
      address: s(form, "address") || null,
    },
  });
  revalidatePath("/");
  redirect(`/companies/${company.id}`);
}

export async function updateCompany(companyId: string, form: FormData) {
  await requireUser();
  await prisma.company.update({
    where: { id: companyId },
    data: {
      name: s(form, "name"),
      currency: s(form, "currency") || "USD",
      nssfMode: s(form, "nssfMode") === "amount" ? "amount" : "percent",
      nssfValue: n(form, "nssfValue").toString(),
      address: s(form, "address") || null,
    },
  });
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}`);
}

export async function deleteCompany(companyId: string) {
  await requireUser();
  await prisma.company.delete({ where: { id: companyId } });
  revalidatePath("/");
  redirect("/");
}

// ---------- Employees ----------

export async function createEmployee(companyId: string, form: FormData) {
  await requireUser();
  const name = s(form, "name");
  if (!name) throw new Error("Employee name is required");
  await prisma.employee.create({
    data: {
      companyId,
      name,
      employeeNo: s(form, "employeeNo") || null,
      baseSalary: n(form, "baseSalary").toString(),
      standardWorkDays: int(form, "standardWorkDays", 30),
      dailyTransportRate: n(form, "dailyTransportRate").toString(),
      familyAllowance: n(form, "familyAllowance").toString(),
      nssfSubscribed: form.get("nssfSubscribed") === "on",
      loanBalance: n(form, "loanBalance").toString(),
      startDate: s(form, "startDate") ? new Date(s(form, "startDate")) : null,
    },
  });
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}`);
}

export async function updateEmployee(
  companyId: string,
  employeeId: string,
  form: FormData
) {
  await requireUser();
  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      name: s(form, "name"),
      employeeNo: s(form, "employeeNo") || null,
      baseSalary: n(form, "baseSalary").toString(),
      standardWorkDays: int(form, "standardWorkDays", 30),
      dailyTransportRate: n(form, "dailyTransportRate").toString(),
      familyAllowance: n(form, "familyAllowance").toString(),
      nssfSubscribed: form.get("nssfSubscribed") === "on",
      loanBalance: n(form, "loanBalance").toString(),
      startDate: s(form, "startDate") ? new Date(s(form, "startDate")) : null,
      active: form.get("active") === "on",
    },
  });
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}`);
}

export async function deleteEmployee(companyId: string, employeeId: string) {
  await requireUser();
  await prisma.employee.delete({ where: { id: employeeId } });
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}`);
}

/** Inline loan/advance balance edit from the main employees table. */
export async function setLoanBalance(
  companyId: string,
  employeeId: string,
  form: FormData
) {
  await requireUser();
  await prisma.employee.update({
    where: { id: employeeId },
    data: { loanBalance: n(form, "loanBalance").toString() },
  });
  const returnTo = s(form, "returnTo") || `/companies/${companyId}`;
  revalidatePath(returnTo);
  redirect(returnTo);
}

// ---------- Attendance (تسجيل حضور يومي) ----------

/**
 * Set one day's attendance for an employee. `next` cycles the day:
 *   present (no record) → unpaid absence → paid absence → present …
 * present deletes the day's absence; unpaid/paid upserts it.
 */
export async function setAttendance(
  companyId: string,
  employeeId: string,
  form: FormData
) {
  await requireUser();
  const dateStr = s(form, "date");
  const next = s(form, "next"); // present | unpaid | paid
  const returnTo = s(form, "returnTo");
  if (dateStr) {
    const date = new Date(dateStr);
    if (next === "present") {
      await prisma.absence.deleteMany({ where: { employeeId, date } });
    } else {
      const paid = next === "paid";
      await prisma.absence.upsert({
        where: { employeeId_date: { employeeId, date } },
        update: { paid, kind: "full" },
        create: { employeeId, date, paid, kind: "full" },
      });
    }
  }
  const dest = returnTo || `/companies/${companyId}/employees/${employeeId}`;
  revalidatePath(dest);
  redirect(dest);
}

// ---------- Payroll runs ----------

export async function createRun(companyId: string, form: FormData) {
  await requireUser();
  const month = parseInt(s(form, "month"), 10);
  const year = parseInt(s(form, "year"), 10);
  if (!month || !year) throw new Error("Month and year are required");

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  });
  const nssfMode = company.nssfMode;
  const nssfValue = Number(company.nssfValue);

  const existing = await prisma.payrollRun.findUnique({
    where: { companyId_month_year: { companyId, month, year } },
  });
  if (existing) redirect(`/companies/${companyId}/runs/${existing.id}`);

  const employees = await prisma.employee.findMany({
    where: { companyId, active: true },
    orderBy: { name: "asc" },
  });

  // Attendance recorded for this month, used to auto-fill days worked and the
  // unpaid-absence deduction (both still editable on the payslip afterwards).
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));
  const monthAbsences = await prisma.absence.findMany({
    where: {
      employeeId: { in: employees.map((e) => e.id) },
      date: { gte: monthStart, lt: monthEnd },
    },
    select: { employeeId: true, kind: true, paid: true },
  });

  const run = await prisma.payrollRun.create({
    data: {
      companyId,
      month,
      year,
      payslips: {
        create: employees.map((e) => {
          const base = Number(e.baseSalary);
          const list = monthAbsences.filter((a) => a.employeeId === e.id);
          const absentDays = absenceDays(list);
          const unpaidDays = absenceDays(list.filter((a) => !a.paid));
          const wage = dailyWage(base, e.standardWorkDays);
          const daysWorked = Math.max(0, e.standardWorkDays - absentDays);
          const amounts: PayslipAmounts = {
            baseSalary: base,
            dailyTransportRate: Number(e.dailyTransportRate),
            daysWorked,
            familyAllowance: Number(e.familyAllowance),
            overtime: 0,
            salaryAdjAddition: 0,
            otherAdditions: 0,
            nssfDeduction: e.nssfSubscribed
              ? computeNssf(base, nssfMode, nssfValue)
              : 0,
            nssfDifference: 0,
            absenceDeduction: round2(unpaidDays * wage),
            salaryAdjDeduction: 0,
            purchases: 0,
            advance: 0,
            loanPayment: 0,
          };
          return {
            employeeId: e.id,
            standardWorkDays: e.standardWorkDays,
            ...toStrings(amounts),
            loanBalanceBefore: e.loanBalance.toString(),
            netPay: netPay(amounts).toString(),
          };
        }),
      },
    },
  });

  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}/runs/${run.id}`);
}

/**
 * Save the whole run as a draft: persist every payslip's edited amounts in one
 * transaction. Leaves the run status as "draft" (nothing is locked, no loan
 * balances are touched). Inputs are namespaced per payslip: `${id}__field`.
 */
export type SaveDraftState = { ok: boolean; ts: number; count: number } | null;

export async function saveRunDraft(
  companyId: string,
  runId: string,
  _prev: SaveDraftState,
  form: FormData
): Promise<SaveDraftState> {
  await requireUser();
  const ids = String(form.get("payslipIds") || "")
    .split(",")
    .filter(Boolean);

  await prisma.$transaction(
    ids.map((id) => {
      const amounts = {} as PayslipAmounts;
      for (const f of INPUT_FIELDS) amounts[f] = n(form, `${id}__${f}`);
      return prisma.payslip.update({
        where: { id },
        data: {
          ...toStrings(amounts),
          loanBalanceBefore: n(form, `${id}__loanBalanceBefore`).toString(),
          netPay: netPay(amounts).toString(),
        },
      });
    })
  );

  revalidatePath(`/companies/${companyId}/runs/${runId}`);
  return { ok: true, ts: Date.now(), count: ids.length };
}

/**
 * Finalize a run: lock it and apply loan payments to each employee's
 * outstanding loan balance.
 */
export async function finalizeRun(companyId: string, runId: string) {
  await requireUser();
  const run = await prisma.payrollRun.findUniqueOrThrow({
    where: { id: runId },
    include: { payslips: true },
  });
  if (run.status === "finalized") {
    redirect(`/companies/${companyId}/runs/${runId}`);
  }

  await prisma.$transaction([
    ...run.payslips
      .filter((p) => Number(p.loanPayment) !== 0)
      .map((p) =>
        prisma.employee.update({
          where: { id: p.employeeId },
          data: {
            loanBalance: {
              decrement: p.loanPayment,
            },
          },
        })
      ),
    prisma.payrollRun.update({
      where: { id: runId },
      data: { status: "finalized" },
    }),
  ]);

  revalidatePath(`/companies/${companyId}/runs/${runId}`);
  redirect(`/companies/${companyId}/runs/${runId}`);
}

export async function deleteRun(companyId: string, runId: string) {
  await requireUser();
  await prisma.payrollRun.delete({ where: { id: runId } });
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}`);
}

function toStrings(a: PayslipAmounts): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of INPUT_FIELDS) {
    out[f] = (a[f] || 0).toString();
  }
  // transport is derived from the daily rate × days worked
  out.transportAllowance = transportAllowance(a).toString();
  return out;
}
