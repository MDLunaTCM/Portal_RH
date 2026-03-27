"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Card, Progress } from "@/components/ui";
import { IconEye, IconEyeOff, IconCheck } from "@/components/icons";
import { setPassword } from "@/modules/auth/actions";
import { createClient } from "@/lib/supabase/client";

const passwordRequirements = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "uppercase", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p: string) => /\d/.test(p) },
  { id: "special", label: "One special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function SetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Verify an active session exists (invite/reset token must have been exchanged first).
  // Without this check, the user can reach this page directly and get a cryptic error on submit.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError(
          "El enlace de invitación o recuperación no es válido o ya expiró. " +
          "Solicita uno nuevo a tu área de RH."
        );
      }
    });
  }, []);

  const metRequirements = passwordRequirements.filter((r) => r.test(password));
  const passwordStrength = (metRequirements.length / passwordRequirements.length) * 100;
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const sessionError = error?.includes("enlace") ?? false;
  const canSubmit =
    !sessionError &&
    metRequirements.length === passwordRequirements.length &&
    passwordsMatch &&
    employeeId.length > 0;

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    const { error: authError } = await setPassword(password);

    if (authError) {
      setError(authError);
      setIsLoading(false);
      return;
    }

    router.push("/login");
  };

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
        <h2 className="text-2xl font-bold text-foreground">Set up your account</h2>
        <p className="text-muted-foreground">
          First time accessing the portal? Create your secure password.
        </p>
      </div>

      <Card padding="lg" className="shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Input
            label="Employee ID"
            type="text"
            placeholder="Enter your employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            helperText="Your employee ID was provided in your welcome email"
            required
          />

          <div className="relative">
            <Input
              label="New password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPasswordValue(e.target.value)}
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

          {password && (
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Password strength</span>
                  <span className={`font-medium ${
                    passwordStrength < 40 ? "text-error-foreground" :
                    passwordStrength < 80 ? "text-warning-foreground" :
                    "text-success-foreground"
                  }`}>
                    {passwordStrength < 40 ? "Weak" : passwordStrength < 80 ? "Good" : "Strong"}
                  </span>
                </div>
                <Progress value={passwordStrength} />
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {passwordRequirements.map((req) => (
                  <div
                    key={req.id}
                    className={`flex items-center gap-2 text-xs ${
                      req.test(password) ? "text-success-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {req.test(password) ? (
                      <IconCheck className="h-3.5 w-3.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-current" />
                    )}
                    {req.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <Input
              label="Confirm password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPassword && !passwordsMatch ? "Passwords do not match" : undefined}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
            </button>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading} disabled={!canSubmit}>
            Create account
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary hover:text-primary-hover font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
