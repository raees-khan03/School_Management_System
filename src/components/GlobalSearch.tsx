"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  User,
  GraduationCap,
  Users,
  BookOpen,
  Loader2,
  ArrowRight,
  Command,
} from "lucide-react";
import { globalSearch, type SearchResultItem } from "@/lib/actions/search";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut (Ctrl+K or Cmd+K) to toggle search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Debounced Live Search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const data = await globalSearch(query);
      setResults(data);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  const getIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "student":
        return <GraduationCap className="h-4 w-4 text-indigo-600" />;
      case "teacher":
        return <User className="h-4 w-4 text-teal-600" />;
      case "class":
        return <Users className="h-4 w-4 text-amber-600" />;
      case "subject":
        return <BookOpen className="h-4 w-4 text-emerald-600" />;
    }
  };

  return (
    <>
      {/* NAVBAR TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-10 w-full max-w-sm items-center justify-between rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-400 transition-all hover:border-slate-300 hover:bg-white hover:text-slate-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400 transition-colors group-hover:text-teal-600" />
          <span className="text-slate-400">Search campus...</span>
        </div>
        <kbd className="hidden items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 shadow-2xs sm:inline-flex">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* SPOTLIGHT SEARCH MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-16 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* SEARCH INPUT */}
            <div className="flex items-center border-b border-slate-100 px-4 py-3">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students, teachers, classes, subjects..."
                className="h-10 w-full bg-transparent px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-teal-600 shrink-0" />}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* RESULTS LIST */}
            <div className="max-h-96 overflow-y-auto p-2">
              {results.length > 0 && (
                <div className="space-y-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Results ({results.length})
                  </p>
                  {results.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          {getIcon(item.type)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-teal-700">
                            {item.title}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-teal-600 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {query.trim().length >= 2 && !loading && results.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm font-medium text-slate-700">No results found</p>
                  <p className="mt-1 text-xs text-slate-400">
                    No matching student, teacher, class, or subject found for &quot;{query}&quot;.
                  </p>
                </div>
              )}

              {!query.trim() && (
                <div className="p-6 text-center text-xs text-slate-400">
                  Type at least 2 characters or press <kbd className="rounded border bg-slate-100 px-1 font-semibold text-slate-600">ESC</kbd> to exit.
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] font-medium text-slate-400">
              <span>Quick navigation</span>
              <div className="flex items-center gap-3">
                <span><kbd className="rounded border bg-white px-1 font-semibold text-slate-600">↑</kbd> <kbd className="rounded border bg-white px-1 font-semibold text-slate-600">↓</kbd> to navigate</span>
                <span><kbd className="rounded border bg-white px-1 font-semibold text-slate-600">ESC</kbd> to close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}