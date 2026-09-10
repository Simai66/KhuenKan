"use client";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
export function AutoRefresh() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        startTransition(() => router.refresh());
    }, 30000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
