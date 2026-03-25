"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input, Card } from "@/components/ui";
import { IconMail, IconArrowRight, IconCheck } from "@/components/icons";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
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
          <h2 className="text-xl font-bold text-foreground mb-2">Check your email</h2>
          <p className="text-muted-foreground mb-6">
            We&apos;ve sent password reset instructions to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
          <div className="space-y-3">
            <Button variant="secondary" className="w-full" onClick={() => setIsSubmitted(false)}>
              Try another email
            </Button>
            <Link href="/login" className="block">
              <Button variant="ghost" className="w-full">
                Back to login
              </Button>
            </Link>
          </div>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive the email? Check your spam folder or{" "}
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            try again
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
        <h2 className="text-2xl font-bold text-foreground">Reset your password</h2>
        <p className="text-muted-foreground">
          Enter your email address and we&apos;ll send you instructions to reset your password.
        </p>
      </div>

      <Card padding="lg" className="shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
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
            Send reset instructions
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-primary hover:text-primary-hover font-medium transition-colors"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}
