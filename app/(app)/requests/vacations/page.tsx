"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * This page has been superseded by the unified requests module (TASK-011/012).
 * All vacation requests are now created and managed from /requests and /requests/new.
 */
export default function VacationsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/requests");
  }, [router]);
  return null;
}
