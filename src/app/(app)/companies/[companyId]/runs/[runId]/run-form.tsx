"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { SaveDraftState } from "@/lib/actions";
import { tf } from "@/lib/i18n";

type Action = (
  prev: SaveDraftState,
  form: FormData
) => Promise<SaveDraftState>;

type Labels = {
  saveDraft: string;
  saving: string;
  draftNote: string;
  toastSaved: string;
};

export function RunForm({
  action,
  payslipIds,
  currency,
  labels,
  children,
}: {
  action: Action;
  payslipIds: string;
  currency: string;
  labels: Labels;
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
      <SaveBar currency={currency} labels={labels} />
      <Toast state={state} labels={labels} />
    </form>
  );
}

function SaveBar({ currency, labels }: { currency: string; labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
      <span className="text-sm text-slate-500">
        {labels.draftNote} ({currency})
      </span>
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? labels.saving : labels.saveDraft}
      </button>
    </div>
  );
}

function Toast({
  state,
  labels,
}: {
  state: SaveDraftState;
  labels: Labels;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [state?.ts, state?.ok]);

  if (!visible || !state?.ok) return null;

  return (
    <div className="fixed bottom-6 end-6 z-50 flex items-center gap-3 rounded-lg bg-green-600 px-4 py-3 text-sm text-white shadow-xl">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
        ✓
      </span>
      {tf(labels.toastSaved, { n: state.count })}
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="ms-2 text-white/80 hover:text-white"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
