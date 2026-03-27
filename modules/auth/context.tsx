"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "./types";

// -----------------------------------------------------------------------
// Context shape
// -----------------------------------------------------------------------

interface SessionContextValue {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  profile: null,
  isLoading: true,
});

// -----------------------------------------------------------------------
// SessionProvider
// Must be rendered in the root layout (Server Component) so it wraps
// the entire app. Receives SSR-fetched user + profile as initial state
// and subscribes to Supabase auth state changes for client-side sync.
// -----------------------------------------------------------------------

interface SessionProviderProps {
  children: ReactNode;
  initialUser: User | null;
  initialProfile: UserProfile | null;
}

export function SessionProvider({
  children,
  initialUser,
  initialProfile,
}: SessionProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [isLoading, setIsLoading] = useState(!initialUser);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setProfile((data as UserProfile) ?? null);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ user, profile, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}

// -----------------------------------------------------------------------
// useSession — consume session state in any Client Component
// -----------------------------------------------------------------------

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}
