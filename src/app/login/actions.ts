"use server";

import { redirect } from "next/navigation";
import { authenticate, createSession, destroySession } from "@/lib/auth";

export type LoginError = "required" | "invalid" | null;

export async function login(
  _prev: LoginError,
  form: FormData
): Promise<LoginError> {
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  if (!email || !password) return "required";

  const user = await authenticate(email, password);
  if (!user) return "invalid";

  await createSession(user);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
