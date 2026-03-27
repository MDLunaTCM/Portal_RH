"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * This page has been superseded by the unified requests module (TASK-011/012).
 * Badge and parking card requests are now created and managed from /requests and /requests/new.
 */
export default function CardsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/requests");
  }, [router]);
  return null;
}
