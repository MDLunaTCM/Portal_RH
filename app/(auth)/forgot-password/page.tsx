"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Input, Card } from "@/components/ui";
import { IconMail, IconArrowRight, IconCheck } from "@/components/icons";
import { forgotPassword } from "@/modules/auth/actions";

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const isSetup = searchParams.get("setup") === "true";

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error: authError } = await forgotPassword(email);

    setIsLoading(false);

    if (authError) {
      setError(authError);
      return;
    }

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div className="lg:hidden text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">RH</span>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-foreground">Portal RH</h1>
              <p className="text-sm text-muted-foreground">Human Resources</p>
            </div>
          </div>
        </div>

        <Card padding="lg" className="shadow-lg text-center">
          <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center mx-auto mb-4">
            <IconCheck className="w-8 h-8 text-success-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Revisa tu correo</h2>
          <p className="text-muted-foreground mb-6">
            {isSetup
              ? "Te enviamos un enlace para activar tu cuenta a "
              : "Te enviamos instrucciones para restablecer tu contraseña a "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
          <div className="space-y-3">
            <Button variant="secondary" className="w-full" onClick={() => setIsSubmitted(false)}>
              Intentar con otro correo
            </Button>
            <Link href="/login" className="block">
              <Button variant="ghost" className="w-full">
                Volver al inicio de sesión
              </Button>
            </Link>
          </div>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          ¿No recibiste el correo? Revisa tu carpeta de spam o{" "}
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            intenta de nuevo
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="lg:hidden text-center mb-8">
        <div className="inline-flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">RH</span>
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold text-foreground">Portal RH</h1>
            <p className="text-sm text-muted-foreground">Human Resources</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-center lg:text-left">
        <h2 className="text-2xl font-bold text-foreground">
          {isSetup ? "Activa tu cuenta" : "Recupera tu contraseña"}
        </h2>
        <p className="text-muted-foreground">
          {isSetup
            ? "Ingresa tu correo corporativo y te enviaremos un enlace para crear tu contraseña."
            : "Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña."}
        </p>
      </div>

      <Card padding="lg" className="shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="relative">
            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <IconMail className="absolute right-3 top-9 h-5 w-5 text-muted-foreground" />
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading} rightIcon={<IconArrowRight className="w-4 h-4" />}>
            {isSetup ? "Enviar enlace de activación" : "Enviar instrucciones"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        {isSetup ? "¿Ya tienes contraseña?" : "¿Recordaste tu contraseña?"}{" "}
        <Link
          href="/login"
          className="text-primary hover:text-primary-hover font-medium transition-colors"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
