"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

// Debounced search. URL ke ?search= se sync rehta hai, is liye "Clear filters"
// dabane par input bhi khud khali ho jata hai.
export default function TableSearch({ placeholder = "Search..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlValue = searchParams.get("search") ?? "";
  const [value, setValue] = useState(urlValue);
  const lastPushed = useRef(urlValue);

  // URL bahar se badle (clear filters, back button) to input update karo
  useEffect(() => {
    if (urlValue !== lastPushed.current) {
      lastPushed.current = urlValue;
      setValue(urlValue);
    }
  }, [urlValue]);

  // Typing ke 400ms baad URL update
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === lastPushed.current) return;

    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) params.set("search", trimmed);
      else params.delete("search");
      params.delete("page");
      lastPushed.current = trimmed;
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full md:w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}