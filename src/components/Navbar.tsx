"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/useRole";
import { MessageSquare, Bell, User, Settings, LogOut, CheckCircle2, Clock } from "lucide-react";
import GlobalSearch from "@/components/GlobalSearch";
import { getUserNotifications, markNotificationAsRead } from "@/lib/actions/notification";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const { signOut } = useClerk();
  const { role, user } = useRole();
  const router = useRouter();

  // Load User In-App Notifications
  useEffect(() => {
    getUserNotifications().then(setNotifications);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const handleReadNotif = async (id: number) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
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
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/list/messages"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Messages"
            >
              <MessageSquare className="h-4.5 w-4.5" strokeWidth={2} />
            </Link>

            {/* NOTIFICATION BELL DROPDOWN */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Notifications"
              >
                <Bell className="h-4.5 w-4.5" strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[9px] font-bold text-white border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* NOTIFICATION DROPDOWN MENU */}
              {notifOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-1">
                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                    <span className="text-[11px] font-medium text-slate-400">{notifications.length} total</span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleReadNotif(n.id)}
                        className={`p-3 rounded-xl transition-colors cursor-pointer ${
                          n.isRead ? "bg-white hover:bg-slate-50" : "bg-teal-50/40 hover:bg-teal-50/70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900">{n.title}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(n.createdAt).toLocaleDateString("en-GB")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">{n.message}</p>
                      </div>
                    ))}

                    {notifications.length === 0 && (
                      <p className="p-6 text-center text-xs text-slate-400">No notifications yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden h-6 w-px bg-slate-200 sm:block" />

          {/* PROFILE DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="group flex items-center gap-3 rounded-full border border-transparent p-1 transition-all hover:bg-slate-50"
            >
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-700">
                  {user?.fullName || "User Name"}
                </span>
                <span className="mt-0.5 inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 capitalize ring-1 ring-inset ring-teal-600/20">
                  {currentRole}
                </span>
              </div>
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                <Image src={user?.imageUrl || "/noAvatar.png"} alt="Avatar" fill sizes="36px" unoptimized className="object-cover" />
              </div>
            </button>

            {open && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg">
                <button onClick={() => { setOpen(false); router.push(profileUrl); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  <User className="h-4 w-4 text-slate-400" /> My Profile
                </button>
                <button onClick={() => { setOpen(false); router.push("/settings"); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  <Settings className="h-4 w-4 text-slate-400" /> Account Settings
                </button>
                <div className="my-1 h-px bg-slate-100" />
                <button onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4 text-red-500" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}