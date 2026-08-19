import type { Metadata } from "next";
import "./globals.css";
import { dir, dict } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n.server";
import { I18nProvider } from "@/lib/i18n.client";

export const metadata: Metadata = {
  title: "Payroll",
  description: "Multi-company employee payroll management",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dir(locale)}>
      <body>
        <I18nProvider locale={locale} t={dict[locale]}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
