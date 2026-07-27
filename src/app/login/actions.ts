"use server";

import { redirect } from "next/navigation";
import { authenticate, createSession, destroySession } from "@/lib/auth";

export async function login(_prev: string | null, form: FormData): Promise<string | null> {
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  if (!email || !password) return "Email and password are required.";

  const user = await authenticate(email, password);
  if (!user) return "Invalid email or password.";

  await createSession(user);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
