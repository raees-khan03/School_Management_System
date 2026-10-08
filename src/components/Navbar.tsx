"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/useRole";
import { MessageSquare, Bell, User, Settings, LogOut } from "lucide-react";
import GlobalSearch from "@/components/GlobalSearch"; // ✅ Import Global Search

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { signOut } = useClerk();
  const { role, user } = useRole();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const currentRole = role || "User";
  const profileUrl = role === "admin" ? "/profile" : `/${currentRole}/profile`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md transition-all sm:px-6">
      <div className="flex items-center justify-between">
        {/* GLOBAL SEARCH */}
        <div className="flex-1 max-w-sm">
          <GlobalSearch />
        </div>

        {/* ICONS & PROFILE */}
        <div className="flex flex-1 items-center justify-end gap-4 sm:gap-6">
          
          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/list/messages"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20"
              aria-label="Messages"
            >
              <MessageSquare className="h-4.5 w-4.5" strokeWidth={2} />
            </Link>
            
            <Link
              href="/list/announcements"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20"
              aria-label="Announcements"
            >
              <Bell className="h-4.5 w-4.5" strokeWidth={2} />
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500 border-2 border-white" />
              </span>
            </Link>
          </div>

          <div className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />

          {/* PROFILE DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-haspopup="true"
              className="group flex items-center gap-3 rounded-full border border-transparent p-1 transition-all hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20"
            >
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                  {user?.fullName || "User Name"}
                </span>
                <span className="mt-0.5 inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-teal-700 capitalize ring-1 ring-inset ring-teal-600/20">
                  {currentRole}
                </span>
              </div>
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm transition-transform group-hover:scale-105">
                <Image
                  src={user?.imageUrl || "/noAvatar.png"}
                  alt={user?.fullName || "Avatar"}
                  fill
                  sizes="36px"
                  unoptimized
                  className="object-cover"
                />
              </div>
            </button>

            {/* DROPDOWN MENU */}
            {open && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 origin-top-right rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-200/50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="mb-1 border-b border-slate-100 px-3 py-2.5 sm:hidden">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user?.fullName}
                  </p>
                  <p className="truncate text-xs font-medium text-slate-500 capitalize">
                    {currentRole}
                  </p>
                </div>

                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => {
                      setOpen(false);
                      router.push(profileUrl);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setOpen(false);
                      router.push("/settings");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    Account Settings
                  </button>
                </div>

                <div className="my-1 h-px bg-slate-100" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}