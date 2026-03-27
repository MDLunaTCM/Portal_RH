"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Input, Card } from "@/components/ui";
import { IconMail, IconEye, IconEyeOff } from "@/components/icons";
import { login } from "@/modules/auth/actions";

const QUERY_ERRORS: Record<string, string> = {
  link_expired:
    "El enlace de invitación o recuperación expiró. Solicita uno nuevo a tu área de RH.",
  auth_callback_failed:
    "No se pudo procesar el enlace de acceso. Intenta de nuevo.",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    queryError ? (QUERY_ERRORS[queryError] ?? null) : null
  );

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error: authError } = await login(email, password);

    if (authError) {
      setError(authError);
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      {/* Mobile logo */}
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
        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
        <p className="text-muted-foreground">Sign in to access your HR portal</p>
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
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <IconMail className="absolute right-3 top-9 h-5 w-5 text-muted-foreground" />
          </div>

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-input text-primary focus:ring-ring"
              />
              <span className="text-muted-foreground">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>
        </form>
      </Card>

      <Card padding="md" className="bg-muted/50">
        <p className="text-center text-sm text-muted-foreground">
          ¿Primera vez?{" "}
          <Link
            href="/forgot-password?setup=true"
            className="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Activa tu cuenta aquí
          </Link>
        </p>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        By signing in, you agree to our{" "}
        <Link href="#" className="underline hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
