"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, Building2, X, Loader2 } from "lucide-react";
import { menuItems, type Role } from "@/lib/menuItems";

const cn = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

interface Props {
  role: Role | null;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({
  role,
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const dashboardRoutes = ["/", "/admin", "/teacher", "/student", "/parent"];
  const currentRole = (role?.toLowerCase().trim() as Role) || "admin";

  const isActive = (href: string) => {
    if (href === "/") return dashboardRoutes.includes(pathname);
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const go = (href: string) => {
    onMobileClose();
    if (href === pathname) return;
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <>
      {/* Top progress bar when navigation is pending */}
      {isPending && (
        <div className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-teal-100/20">
          <div className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] bg-teal-500" />
        </div>
      )}

      {/* Mobile overlay */}
      <div
        onClick={onMobileClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-slate-950 text-white",
          "bg-[radial-gradient(circle_at_top_left,rgb(20_184_166/0.18),transparent_55%)]",
          "transition-[width,transform] duration-300 ease-in-out",
          "md:sticky md:top-0 md:h-screen md:translate-x-0",
          collapsed ? "md:w-20" : "md:w-[264px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Section */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-white/10 px-4",
            collapsed ? "md:justify-center" : "justify-between"
          )}
        >
          <button
            type="button"
            onClick={() => go("/")}
            className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 rounded-xl"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 shadow-lg shadow-teal-500/20">
              <Building2 className="h-5 w-5 text-white" />
            </span>
            <span className={cn("text-lg font-bold tracking-tight", collapsed && "md:hidden")}>
              CampusPulse
            </span>
          </button>
          <button
            onClick={onMobileClose}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-[4.5rem] z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:bg-slate-50 md:flex"
        >
          <ChevronLeft
            className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")}
          />
        </button>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-3 py-5">
          {menuItems.map((section) => {
            const items = section.items.filter((i) => i.visible.includes(currentRole));
            if (items.length === 0) return null;

            return (
              <div key={section.title}>
                {!collapsed ? (
                  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    {section.title}
                  </p>
                ) : (
                  <div className="mx-auto mb-2 hidden h-px w-8 bg-white/10 md:block" />
                )}

                <ul className="space-y-1">
                  {items.map((item) => {
                    const active = isActive(item.href);
                    const href = item.href === "/" && currentRole ? `/${currentRole}` : item.href;
                    const Icon = item.icon; // Extracted Lucide component

                    return (
                      <li key={item.label}>
                        <button
                          type="button"
                          title={collapsed ? item.label : undefined}
                          onClick={() => go(href)}
                          className={cn(
                            "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50",
                            collapsed && "md:justify-center md:px-0",
                            active
                              ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]"
                              : "text-slate-300 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-teal-400 shadow-[0_0_12px_rgb(45_212_191)]" />
                          )}
                          
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                            {/* RENDER LUCIDE ICON INSTEAD OF NEXT/IMAGE */}
                            <Icon 
                              className={cn(
                                "h-4.5 w-4.5 transition-colors",
                                active ? "text-teal-400" : "text-slate-400 group-hover:text-slate-200"
                              )} 
                            />
                          </span>
                          
                          <span className={cn("flex-1 truncate", collapsed && "md:hidden")}>
                            {item.label}
                          </span>
                          
                          {isPending && !active && (
                            <Loader2
                              className={cn(
                                "h-3.5 w-3.5 animate-spin text-teal-300 opacity-0",
                                collapsed && "md:hidden"
                              )}
                            />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>

      <style jsx global>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </>
  );
}