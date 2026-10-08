"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ListFilter } from "lucide-react";

type Option = { label: string; value: string };

// param = URL ka naam (jaise "classId"), options = dropdown ki list
export default function FilterButton({
  param,
  label = "Filter",
  options,
}: {
  param: string;
  label?: string;
  options: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = searchParams.get(param);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(param, value);
    else params.delete(param);
    params.delete("page"); // filter badalne par page 1 se shuru
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Filter by ${label}`}
        title={`Filter by ${label}`}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20 ${
          current
            ? "border-teal-300 bg-teal-50 text-teal-700"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        <ListFilter className="h-4 w-4" />
        {current && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-teal-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <ul className="max-h-64 overflow-y-auto p-1">
            <li>
              <MenuItem active={!current} onClick={() => select(null)}>
                All
              </MenuItem>
            </li>
            {options.map((o) => (
              <li key={o.value}>
                <MenuItem active={current === o.value} onClick={() => select(o.value)}>
                  {o.label}
                </MenuItem>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
        active ? "bg-teal-50 font-medium text-teal-700" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span className="truncate">{children}</span>
      {active && <Check className="h-4 w-4 shrink-0" />}
    </button>
  );
}