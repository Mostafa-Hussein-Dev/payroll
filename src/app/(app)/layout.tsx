import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n.server";
import { logout } from "../login/actions";
import { LanguageToggle } from "./components/language-toggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const { t } = await getT();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              ₱
            </span>
            {t.common.appName}
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">
              {user.email}
            </span>
            <LanguageToggle />
            <form action={logout}>
              <button className="btn-secondary py-1.5" type="submit">
                {t.common.signOut}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
