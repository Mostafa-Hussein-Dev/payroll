"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { SaveDraftState } from "@/lib/actions";

type Action = (
  prev: SaveDraftState,
  form: FormData
) => Promise<SaveDraftState>;

export function RunForm({
  action,
  payslipIds,
  currency,
  children,
}: {
  action: Action;
  payslipIds: string;
  currency: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState<SaveDraftState, FormData>(
    action,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="payslipIds" value={payslipIds} />
      {children}
      <SaveBar currency={currency} />
      <Toast state={state} />
    </form>
  );
}

function SaveBar({ currency }: { currency: string }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
      <span className="text-sm text-slate-500">
        Edits are saved as a <strong>draft</strong> — nothing is locked and loan
        balances are untouched until you finalize. ({currency})
      </span>
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save draft"}
      </button>
    </div>
  );
}

function Toast({ state }: { state: SaveDraftState }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3500);
      return () => clearTimeout(t);
    }
    // re-run whenever a new save completes (ts changes)
  }, [state?.ts, state?.ok]);

  if (!visible || !state?.ok) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg bg-green-600 px-4 py-3 text-sm text-white shadow-xl">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
        ✓
      </span>
      Draft saved — {state.count} payslip{state.count === 1 ? "" : "s"} updated.
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="ml-2 text-white/80 hover:text-white"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
