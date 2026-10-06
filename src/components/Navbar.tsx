"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/useRole";

const Navbar = () => {
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

  return (
    <div className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between transition-all">
      {/* SEARCH BAR - Modern SaaS Style */}
      <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all shadow-inner">
        <Image src={"/search.png"} alt="search" height={16} width={16} className="opacity-50" />
        <input
          type="text"
          placeholder="Search anything..."
          className="outline-none w-[250px] bg-transparent text-sm placeholder-slate-400"
        />
      </div>

      {/* ICONS & PROFILE */}
      <div className="flex items-center gap-5 w-full justify-end">
        
        {/* Action Icons */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 hover:bg-slate-200 transition-colors rounded-full w-9 h-9 flex items-center justify-center cursor-pointer">
            <Image src={"/message.png"} alt="messages" width={18} height={18} className="opacity-70" />
          </div>
          <div className="bg-slate-100 hover:bg-slate-200 transition-colors rounded-full w-9 h-9 flex items-center justify-center cursor-pointer relative">
            <Image src={"/announcement.png"} alt="announcements" width={18} height={18} className="opacity-70" />
            {/* Notification Badge with Ping effect */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-600 items-center justify-center text-[9px] text-white font-bold border-2 border-white">
                1
              </span>
            </span>
          </div>
        </div>

        {/* PROFILE STRIP & DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-full transition-colors border border-transparent hover:border-slate-200"
            onClick={() => setOpen((prev) => !prev)}
          >
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-sm font-semibold text-slate-800">
                {user?.fullName || "User Name"}
              </span>
              <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full w-fit self-end capitalize mt-0.5">
                {currentRole}
              </span>
            </div>
            <Image
              src={user?.imageUrl || "/avatar.png"}
              alt="avatar"
              height={40}
              width={40}
              className="rounded-full object-cover shadow-sm ring-2 ring-white"
            />
          </div>

          {/* DROPDOWN MENU - With modern shadow and animation */}
          {open && (
            <div className="absolute right-0 top-14 bg-white rounded-xl shadow-xl border border-slate-100 w-48 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-2 border-b border-slate-100 mb-1 sm:hidden">
                <p className="text-sm font-semibold text-slate-800">{user?.fullName}</p>
                <p className="text-xs text-slate-500 capitalize">{currentRole}</p>
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  router.push(`/${currentRole}/profile`);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-600 font-medium rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                My Profile
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/settings");
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-600 font-medium rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                Account Settings
              </button>
              <div className="h-px bg-slate-100 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;