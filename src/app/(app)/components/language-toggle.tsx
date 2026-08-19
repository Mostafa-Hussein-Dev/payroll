"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n.client";
import { setLocale } from "@/lib/i18n.actions";

export function LanguageToggle() {
  const { locale } = useI18n();
  const pathname = usePathname();
  const target = locale === "ar" ? "en" : "ar";
  const label = locale === "ar" ? "English" : "العربية";

  return (
    <form action={setLocale}>
      <input type="hidden" name="locale" value={target} />
      <input type="hidden" name="returnTo" value={pathname} />
      <button type="submit" className="btn-secondary py-1.5">
        {label}
      </button>
    </form>
  );
}
