"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { useI18n } from "@/lib/i18n.client";

export default function LoginPage() {
  const { t } = useI18n();
  const [error, formAction, pending] = useActionState(login, null);

  const errorText =
    error === "required"
      ? t.login.errRequired
      : error === "invalid"
        ? t.login.errInvalid
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            ₱
          </div>
          <h1 className="text-xl font-semibold">{t.common.appName}</h1>
          <p className="text-sm text-slate-500">{t.login.subtitle}</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              {t.login.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              {t.login.password}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="input"
              required
            />
          </div>

          {errorText && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorText}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? t.login.signingIn : t.login.signIn}
          </button>
        </form>
      </div>
    </div>
  );
}
