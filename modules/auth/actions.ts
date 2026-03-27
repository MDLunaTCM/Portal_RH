"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { AuthError } from "@supabase/supabase-js";

// -----------------------------------------------------------------------
// Error mapping — translates Supabase error codes to UI-friendly Spanish
// -----------------------------------------------------------------------

function mapAuthError(error: AuthError): string {
  if ((error.message ?? "").toLowerCase().includes("auth session missing")) {
    return "La sesión de invitación o recuperación expiró. Abre nuevamente el enlace de tu correo para continuar.";
  }

  switch (error.code) {
    case "invalid_credentials":
      return "Correo o contraseña incorrectos.";
    case "email_not_confirmed":
      return "Debes confirmar tu correo electrónico antes de iniciar sesión.";
    case "user_not_found":
      return "No existe una cuenta registrada con ese correo.";
    case "too_many_requests":
      return "Demasiados intentos fallidos. Espera unos minutos antes de reintentar.";
    case "weak_password":
      return "La contraseña no cumple los requisitos mínimos de seguridad.";
    case "same_password":
      return "La nueva contraseña debe ser diferente a la actual.";
    case "session_not_found":
      return "La sesión de invitación o recuperación expiró. Abre nuevamente el enlace de tu correo para continuar.";
    default:
      return error.message ?? "Ocurrió un error inesperado. Intenta de nuevo.";
  }
}

// -----------------------------------------------------------------------
// login — signs in with email + password
// Called from: app/(auth)/login/page.tsx
// -----------------------------------------------------------------------

export async function login(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: mapAuthError(error) };
  return { error: null };
}

// -----------------------------------------------------------------------
// logout — signs out and redirects to /login
// Called from: components/layout/header.tsx (via app layout prop)
// -----------------------------------------------------------------------

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// -----------------------------------------------------------------------
// forgotPassword — sends a password-reset email via Supabase
// Reset link routes through /auth/callback?next=/set-password
// Called from: app/(auth)/forgot-password/page.tsx
// -----------------------------------------------------------------------

export async function forgotPassword(
  email: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/set-password`,
  });

  if (error) return { error: mapAuthError(error) };
  return { error: null };
}

// -----------------------------------------------------------------------
// setPassword — updates the authenticated user's password
// Requires a valid session (either from magic-link invite or reset flow).
// Called from: app/(auth)/set-password/page.tsx
// -----------------------------------------------------------------------

export async function setPassword(
  password: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: mapAuthError(error) };
  return { error: null };
}
