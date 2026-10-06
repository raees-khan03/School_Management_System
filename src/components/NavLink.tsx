"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { ReactNode } from "react";

const NavLink = ({ children, href }: { children: ReactNode; href: string }) => {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  return (
    <Link href={href} className="block">
      <div
        className={`group relative flex items-center gap-3 py-2.5 px-3 rounded-xl font-medium cursor-pointer transition-all duration-200
          ${
            isActive
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
              : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
          }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-indigo-300" />
        )}
        {children}
      </div>
    </Link>
  );
};

export default NavLink;