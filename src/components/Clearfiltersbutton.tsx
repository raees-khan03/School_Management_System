"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterX } from "lucide-react";

/**
 * Ek click par search, saare filters aur sort hata deta hai (URL poora saaf).
 * Sirf tab nazar aata hai jab koi filter/search/sort laga ho. "page" ginti mein nahi aata.
 * `keep` mein un params ke naam do jo clear nahi hone chahiye (e.g. ["classId"]).
 */
export default function ClearFiltersButton({ keep = [] }: { keep?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeKeys = Array.from(new Set(Array.from(searchParams.keys()))).filter(
    (k) => k !== "page" && !keep.includes(k)
  );

  if (activeKeys.length === 0) return null;

  const clear = () => {
    const params = new URLSearchParams();
    keep.forEach((k) => {
      const v = searchParams.get(k);
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <button
      type="button"
      onClick={clear}
      aria-label={`Clear ${activeKeys.length} active filter${activeKeys.length > 1 ? "s" : ""}`}
      title="Clear search, filters and sort"
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/15"
    >
      <FilterX className="h-4 w-4" />
      <span className="hidden sm:inline">Clear filters</span>
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-semibold tabular-nums text-slate-600">
        {activeKeys.length}
      </span>
    </button>
  );
}