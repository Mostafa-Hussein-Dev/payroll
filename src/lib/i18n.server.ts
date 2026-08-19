import "server-only";
import { cookies } from "next/headers";
import {
  dict,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  Locale,
  Dict,
} from "./i18n";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const v = jar.get(LOCALE_COOKIE)?.value;
  return v === "ar" || v === "en" ? v : DEFAULT_LOCALE;
}

/** Server-side translations for the current request. */
export async function getT(): Promise<{ locale: Locale; t: Dict }> {
  const locale = await getLocale();
  return { locale, t: dict[locale] as Dict };
}
