"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useState, useTransition, type FormEvent, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  MoreHorizontal,
} from "lucide-react";

type Props = {
  /** Current page (1-based) */
  page: number;
  /** Total number of items across all pages */
  count: number;
  /** Items per page (backend decides this) */
  itemPerPage?: number;
  /** Query param name for the page number */
  pageParam?: string;
  /** How many page numbers to show on each side of the current page */
  siblingCount?: number;
  showFirstLast?: boolean;
  showJump?: boolean;
  /** Scroll to top after navigating */
  scroll?: boolean;
};

type PageItem = number | "ellipsis-left" | "ellipsis-right";

const range = (start: number, end: number) =>
  Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);

/** Smart window: 1 … 4 5 6 … 20 (same number of slots, so the bar never jumps around) */
const getPages = (current: number, total: number, siblings: number): PageItem[] => {
  const slots = siblings * 2 + 5;
  if (total <= slots) return range(1, total);

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);
  const showLeftDots = left > 2;
  const showRightDots = right < total - 1;
  const edgeCount = 3 + 2 * siblings;

  if (!showLeftDots && showRightDots) {
    return [...range(1, edgeCount), "ellipsis-right", total];
  }
  if (showLeftDots && !showRightDots) {
    return [1, "ellipsis-left", ...range(total - edgeCount + 1, total)];
  }
  return [1, "ellipsis-left", ...range(left, right), "ellipsis-right", total];
};

/* ── Styles ─────────────────────────────────────────────────── */

const btn =
  "group relative inline-flex h-9 min-w-9 select-none items-center justify-center gap-1 rounded-full px-3 text-sm font-semibold tabular-nums outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-teal-500/30 active:scale-95";

const styles = {
  active:
    "bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-600/30 ring-1 ring-white/20",
  idle: "text-slate-600 hover:bg-white hover:text-teal-700 hover:shadow-sm",
  nav: "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:text-teal-700 hover:ring-teal-300",
  disabled: "cursor-not-allowed text-slate-300",
  navDisabled: "cursor-not-allowed bg-white/60 text-slate-300 ring-1 ring-slate-200/60",
};

type Variant = "page" | "nav";

function PageButton({
  href,
  disabled,
  active,
  variant = "page",
  label,
  children,
  className = "",
  scroll = true,
}: {
  href: string;
  disabled?: boolean;
  active?: boolean;
  variant?: Variant;
  label: string;
  children: ReactNode;
  className?: string;
  scroll?: boolean;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        aria-label={label}
        className={`${btn} ${variant === "nav" ? styles.navDisabled : styles.disabled} ${className}`}
      >
        {children}
      </span>
    );
  }

  const tone = active ? styles.active : variant === "nav" ? styles.nav : styles.idle;

  return (
    <Link
      href={href}
      scroll={scroll}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`${btn} ${tone} ${className}`}
    >
      {children}
    </Link>
  );
}

/* ── Component ──────────────────────────────────────────────── */

export default function Pagination({
  page,
  count,
  itemPerPage = 10,
  pageParam = "page",
  siblingCount = 1,
  showFirstLast = true,
  showJump = true,
  scroll = true,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const jumpId = useId();
  const [jump, setJump] = useState("");
  const [jumpError, setJumpError] = useState(false);

  if (count === 0) return null;

  const totalPages = Math.max(1, Math.ceil(count / itemPerPage));
  const current = Math.min(Math.max(1, page), totalPages);
  const from = (current - 1) * itemPerPage + 1;
  const to = Math.min(current * itemPerPage, count);
  const pages = getPages(current, totalPages, siblingCount);
  const jumpStep = siblingCount * 2 + 1;
  const progress = Math.round((to / count) * 100);

  // Other query params (search, filters…) are preserved
  const hrefFor = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(pageParam, String(p));
    return `${pathname}?${params.toString()}`;
  };

  const go = (p: number) => startTransition(() => router.push(hrefFor(p), { scroll }));

  const onJump = (e: FormEvent) => {
    e.preventDefault();
    const n = parseInt(jump, 10);
    if (!Number.isFinite(n) || n < 1 || n > totalPages) {
      setJumpError(true);
      return;
    }
    setJumpError(false);
    setJump("");
    if (n !== current) go(n);
  };

  return (
    <div
      aria-busy={isPending}
      className="mt-4 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 p-3 shadow-sm sm:p-4 lg:flex-row lg:items-center lg:justify-between"
    >
      {/* ─── Left: results + progress ─── */}
      <div className="flex flex-col items-center gap-2 lg:items-start">
        <p className="flex items-center gap-2 text-sm tabular-nums text-slate-500">
          <span>
            Showing <span className="font-bold text-slate-900">{from}</span>
            <span className="mx-1 text-slate-300">–</span>
            <span className="font-bold text-slate-900">{to}</span> of{" "}
            <span className="font-bold text-teal-700">{count}</span> results
          </span>
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-teal-600" aria-hidden="true" />
          )}
        </p>
        <div
          className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-200/80"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Browsing progress"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ─── Right: navigation + jump ─── */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <nav
            aria-label="Pagination"
            className={`flex items-center justify-center gap-1.5 transition-opacity ${
              isPending ? "opacity-60" : ""
            }`}
          >
            {showFirstLast && (
              <PageButton
                href={hrefFor(1)}
                disabled={current <= 1}
                variant="nav"
                label="First page"
                scroll={scroll}
                className="hidden !px-0 sm:inline-flex sm:w-9"
              >
                <ChevronsLeft className="h-4 w-4" />
              </PageButton>
            )}

            <PageButton
              href={hrefFor(current - 1)}
              disabled={current <= 1}
              variant="nav"
              label="Previous page"
              scroll={scroll}
              className="pl-2.5 pr-3.5"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Prev</span>
            </PageButton>

            {/* Mobile: "Page 2 of 12" */}
            <span className="inline-flex h-9 items-center rounded-full bg-slate-100 px-4 text-sm font-semibold tabular-nums text-slate-700 ring-1 ring-slate-200/70 sm:hidden">
              <span className="text-teal-700">{current}</span>
              <span className="mx-1.5 text-slate-400">of</span>
              {totalPages}
            </span>

            {/* Desktop: page numbers inside a soft track */}
            <div className="hidden items-center gap-1 rounded-full bg-slate-100/80 p-1 ring-1 ring-slate-200/70 sm:flex">
              {pages.map((item) => {
                if (item === "ellipsis-left" || item === "ellipsis-right") {
                  const back = item === "ellipsis-left";
                  const target = back
                    ? Math.max(1, current - jumpStep)
                    : Math.min(totalPages, current + jumpStep);
                  const text = back ? `Back ${jumpStep} pages` : `Forward ${jumpStep} pages`;
                  return (
                    <Link
                      key={item}
                      href={hrefFor(target)}
                      scroll={scroll}
                      aria-label={text}
                      title={text}
                      className="group inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 outline-none transition-all duration-200 hover:bg-white hover:text-teal-700 hover:shadow-sm focus-visible:ring-4 focus-visible:ring-teal-500/30"
                    >
                      <MoreHorizontal className="h-4 w-4 group-hover:hidden" />
                      {back ? (
                        <ChevronsLeft className="hidden h-4 w-4 group-hover:block" />
                      ) : (
                        <ChevronsRight className="hidden h-4 w-4 group-hover:block" />
                      )}
                    </Link>
                  );
                }
                return (
                  <PageButton
                    key={item}
                    href={hrefFor(item)}
                    active={item === current}
                    label={`Page ${item}`}
                    scroll={scroll}
                  >
                    {item}
                  </PageButton>
                );
              })}
            </div>

            <PageButton
              href={hrefFor(current + 1)}
              disabled={current >= totalPages}
              variant="nav"
              label="Next page"
              scroll={scroll}
              className="pl-3.5 pr-2.5"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </PageButton>

            {showFirstLast && (
              <PageButton
                href={hrefFor(totalPages)}
                disabled={current >= totalPages}
                variant="nav"
                label="Last page"
                scroll={scroll}
                className="hidden !px-0 sm:inline-flex sm:w-9"
              >
                <ChevronsRight className="h-4 w-4" />
              </PageButton>
            )}
          </nav>

          {/* Jump to page */}
          {showJump && totalPages > 5 && (
            <form
              onSubmit={onJump}
              className={`hidden items-center gap-1 rounded-full p-1 pl-4 text-sm text-slate-500 ring-1 transition sm:flex ${
                jumpError
                  ? "bg-rose-50 ring-rose-300"
                  : "bg-slate-100/80 ring-slate-200/70 focus-within:ring-2 focus-within:ring-teal-400"
              }`}
            >
              <label htmlFor={jumpId} className="whitespace-nowrap font-medium">
                Go to
              </label>
              <input
                id={jumpId}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={jump}
                placeholder={`1-${totalPages}`}
                aria-invalid={jumpError}
                onChange={(e) => {
                  setJump(e.target.value.replace(/\D/g, "").slice(0, String(totalPages).length));
                  setJumpError(false);
                }}
                className="h-7 w-16 rounded-full border-0 bg-white text-center text-sm font-semibold tabular-nums text-slate-700 shadow-sm outline-none placeholder:font-normal placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!jump || isPending}
                className="inline-flex h-7 items-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 px-3.5 text-xs font-bold text-white shadow-sm outline-none transition hover:shadow-md focus-visible:ring-4 focus-visible:ring-teal-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Go
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}