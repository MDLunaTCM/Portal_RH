import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { SessionProvider } from "@/modules/auth/context";
import type { UserProfile } from "@/modules/auth/types";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portal RH - Human Resources",
  description: "Enterprise HR Portal for employee self-service, HR management, and organizational tools",
};

export const viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch session server-side to hydrate SessionProvider without a loading flash.
  // getUser() is the safe call — it verifies the JWT against Supabase Auth server,
  // unlike getSession() which trusts the cookie unverified.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: UserProfile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = (data as unknown as UserProfile) ?? null;
  }

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider initialUser={user} initialProfile={profile}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
