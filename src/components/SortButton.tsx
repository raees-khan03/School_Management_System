"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";

// URL mein ?sort=asc|desc set karta hai. Page mein orderBy us se connect karna hai.
export default function SortButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = searchParams.get("sort") === "desc" ? "desc" : "asc";

  const toggle = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort === "asc" ? "desc" : "asc");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const Icon = sort === "asc" ? ArrowDownAZ : ArrowUpAZ;
  const text = sort === "asc" ? "Name A to Z" : "Name Z to A";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Sort by name. Currently ${text}`}
      title={`${text} (click to reverse)`}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20 ${
        sort === "desc"
          ? "border-teal-300 bg-teal-50 text-teal-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}