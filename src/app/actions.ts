"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return null;
  return { email, password };
}

export async function signIn(formData: FormData) {
  const credentials = readCredentials(formData);
  if (!credentials) redirect("/login?error=missing-fields");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) redirect("/login?error=sign-in-failed");
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const credentials = readCredentials(formData);
  if (!credentials) redirect("/login?error=missing-fields");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...credentials,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback` },
  });
  if (error) redirect("/login?error=sign-up-failed");
  redirect("/login?message=check-email");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
