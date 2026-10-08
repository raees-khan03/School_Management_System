import Link from "next/link";
import { Eye } from "lucide-react";

export default function ViewButton({ href, label = "View details" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20"
    >
      <Eye className="h-4 w-4" />
    </Link>
  );
}