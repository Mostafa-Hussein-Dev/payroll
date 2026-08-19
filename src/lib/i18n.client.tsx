"use client";

import { createContext, useContext } from "react";
import { Dict, Locale } from "./i18n";

type I18nValue = { locale: Locale; t: Dict };

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  t,
  children,
}: {
  locale: Locale;
  t: Dict;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
