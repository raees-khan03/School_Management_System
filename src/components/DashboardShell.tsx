"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Menu as MenuIcon } from "lucide-react";
import type { Role } from "@/lib/menuItems";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function DashboardShell({
  role,
  children,
}: {
  role: Role | null;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mobile drawer khula ho to body scroll lock
  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        role={role}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="h-screen min-w-0 flex-1 overflow-y-auto bg-[#F7F8FA]">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="m-3 rounded-lg border bg-white p-2 text-slate-600 shadow-sm md:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        {/* Top Navbar */}
        <Navbar />

        {/* Page Children */}
        <main>{children}</main>
      </div>
    </div>
  );
}