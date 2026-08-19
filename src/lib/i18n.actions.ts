"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE } from "./i18n";

export async function setLocale(form: FormData) {
  const locale = form.get("locale") === "ar" ? "ar" : "en";
  const returnTo = String(form.get("returnTo") || "/");
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  redirect(returnTo || "/");
}
