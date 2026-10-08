"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 print:hidden"
    >
      <Printer className="h-4 w-4" />
      Download PDF / Print
    </button>
  );
}