"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  SlidersHorizontal,
  TriangleAlert,
  CheckCircle2,
  AlertCircle,
  LogOut,
  type LucideIcon,
  BellRing,
} from "lucide-react";

// NEW IMPORTS FOR NOTIFICATION SETTINGS
import { 
  getSystemSettings, 
  updateSystemSettings, 
  sendMonthlyFeeReminders 
} from "@/lib/actions/notification";

type UserData = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
  username: string;
  role: string;
};

type TabId = "account" | "security" | "preferences" | "danger";

type Prefs = {
  emailNotifs: boolean;
  examAlerts: boolean;
  announcementAlerts: boolean;
};

const PREFS_KEY = "schoolms:prefs";
const DEFAULT_PREFS: Prefs = {
  emailNotifs: true,
  examAlerts: true,
  announcementAlerts: true,
};

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "account", label: "Account Profile", icon: User },
  { id: "security", label: "Login & Security", icon: Lock },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "danger", label: "Danger Zone", icon: TriangleAlert },
];

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

const primaryBtn =
  "inline-flex h-10 items-center justify-center rounded-lg bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-60";

export default function SettingsClient({ user }: { user: UserData }) {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>("account");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Account State
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [saving, setSaving] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // General Preferences State
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  // Admin Notification Settings State
  const [adminNotifToggle, setAdminNotifToggle] = useState(true);
  const [adminReminderToggle, setAdminReminderToggle] = useState(true);

  // 1. Load User Preferences from Local Storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  // 2. Load System Settings (If user is Admin)
  useEffect(() => {
    if (user.role === "admin") {
      getSystemSettings().then((settings) => {
        setAdminNotifToggle(settings.enableFeeNotifications);
        setAdminReminderToggle(settings.enableFeeReminders);
      });
    }
  }, [user.role]);

  // Toast Auto-hide
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const showMsg = (type: "success" | "error", text: string) => setMessage({ type, text });

  const profileChanged = firstName.trim() !== user.firstName || lastName.trim() !== user.lastName;

  // Save Profile Handler
  const handleSaveProfile = async () => {
    if (!clerkUser || !profileChanged) return;
    setSaving(true);
    try {
      await clerkUser.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      showMsg("success", "Profile updated successfully.");
      router.refresh();
    } catch (err: any) {
      showMsg("error", err?.errors?.[0]?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async () => {
    if (!clerkUser) return;
    if (newPassword.length < 8) {
      showMsg("error", "New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showMsg("error", "Passwords do not match.");
      return;
    }

    setPwLoading(true);
    try {
      await clerkUser.updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showMsg("success", "Password changed successfully.");
    } catch (err: any) {
      showMsg(
        "error",
        err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          "Failed to change password. Check your current password."
      );
    } finally {
      setPwLoading(false);
    }
  };

  // Save General Preferences Handler
  const handleSavePrefs = () => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      showMsg("success", "Preferences saved on this browser.");
    } catch {
      showMsg("error", "Could not save preferences in this browser.");
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/" });
  };

  const canChangePassword = clerkUser ? clerkUser.passwordEnabled : true;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      {/* ===== TABS NAVIGATION ===== */}
      <nav className="w-full shrink-0 lg:w-64" aria-label="Settings sections">
        <ul className="flex gap-2 overflow-x-auto lg:sticky lg:top-8 lg:flex-col lg:overflow-visible pb-2 lg:pb-0">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            const isDanger = id === "danger";
            return (
              <li key={id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center gap-3 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                    active
                      ? isDanger
                        ? "bg-red-50 text-red-700 shadow-sm ring-1 ring-red-200"
                        : "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200"
                      : isDanger
                      ? "text-red-500 hover:bg-red-50/50"
                      : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${active && !isDanger ? "text-teal-600" : ""}`} />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="min-w-0 flex-1 space-y-6">
        {message && (
          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm animate-in fade-in slide-in-from-top-2 ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            )}
            {message.text}
          </div>
        )}

        {/* 1. ACCOUNT TAB */}
        {activeTab === "account" && (
          <Card title="Account Profile" description="Update your personal details and public profile.">
            <div className="flex items-center gap-5 rounded-xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-200 border-2 border-white shadow-sm">
                <Image src={user.imageUrl || "/noAvatar.png"} alt={user.fullName || "User"} fill sizes="64px" unoptimized className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{user.fullName || "User Name"}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 capitalize ring-1 ring-inset ring-teal-600/20">
                    {user.role}
                  </span>
                  <span className="text-xs text-slate-500">Account</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mt-6">
              <Field label="First name">
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="First name" />
              </Field>
              <Field label="Last name">
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Last name" />
              </Field>
              <Field label="Email Address" className="sm:col-span-2" hint="Managed securely via Clerk. Updates are restricted.">
                <input value={user.email} disabled className={inputClass} />
              </Field>
              <Field label="Username">
                <input value={user.username || "—"} disabled className={inputClass} />
              </Field>
            </div>

            <div className="mt-8 flex justify-end border-t border-slate-100 pt-5">
              <button type="button" onClick={handleSaveProfile} disabled={saving || !profileChanged} className={primaryBtn}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </Card>
        )}

        {/* 2. SECURITY TAB */}
        {activeTab === "security" && (
          <Card title="Login & Security" description="Change your password and manage your active sessions.">
            {canChangePassword ? (
              <div className="max-w-md space-y-5">
                <Field label="Current password">
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} placeholder="Enter current password" />
                </Field>
                <Field label="New password" hint="Must be at least 8 characters long.">
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="Enter new password" />
                </Field>
                <Field label="Confirm new password">
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Repeat new password" />
                </Field>
                <button type="button" onClick={handleChangePassword} disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword} className={`${primaryBtn} mt-2`}>
                  {pwLoading ? "Updating..." : "Update password"}
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>You are signed in via a social provider (e.g., Google). Password changes are not applicable for this account.</p>
              </div>
            )}

            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-semibold text-slate-900">Active Sessions</h3>
              <p className="mb-4 mt-1 text-sm text-slate-500">You are currently signed in on this browser device.</p>
              <button type="button" onClick={handleSignOut} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900">
                <LogOut className="h-4 w-4 text-slate-400" /> Sign out of this device
              </button>
            </div>
          </Card>
        )}

        {/* 3. PREFERENCES TAB (Now includes Admin Settings) */}
        {activeTab === "preferences" && (
          <Card title="Preferences" description="Manage your notification and display settings.">
            
            {/* ONLY VISIBLE TO ADMINS */}
            {user.role === "admin" && (
              <div className="mb-8 space-y-4 rounded-xl border border-teal-200 bg-teal-50/40 p-5">
                <div className="flex items-center gap-2 mb-2 border-b border-teal-100 pb-3">
                  <BellRing className="w-5 h-5 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-900">Admin Notification Controls</h3>
                </div>
                
                <ToggleRow
                  title="Automatic Fee Collection Notifications"
                  description="Send an in-app notification to Student & Parent when a fee is collected."
                  checked={adminNotifToggle}
                  onChange={async (val) => {
                    setAdminNotifToggle(val);
                    await updateSystemSettings({ enableFeeNotifications: val, enableFeeReminders: adminReminderToggle });
                  }}
                />

                <ToggleRow
                  title="Enable Monthly Unpaid Fee Reminders"
                  description="Allow sending reminders for unpaid students."
                  checked={adminReminderToggle}
                  onChange={async (val) => {
                    setAdminReminderToggle(val);
                    await updateSystemSettings({ enableFeeNotifications: adminNotifToggle, enableFeeReminders: val });
                  }}
                />

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await sendMonthlyFeeReminders();
                      showMsg(res.success ? "success" : "error", res.message || res.error || "Action Completed");
                    }}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-teal-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
                  >
                    Send Monthly Unpaid Fee Reminders Now
                  </button>
                </div>
              </div>
            )}

            {/* NORMAL PREFERENCES */}
            <div className="divide-y divide-slate-100">
              <ToggleRow
                title="Email Notifications"
                description="Receive daily summaries and important updates."
                checked={prefs.emailNotifs}
                onChange={(v) => setPrefs((p) => ({ ...p, emailNotifs: v }))}
              />
              <ToggleRow
                title="Exam & Assignment Alerts"
                description="Get notified when new assignments or exams are posted."
                checked={prefs.examAlerts}
                onChange={(v) => setPrefs((p) => ({ ...p, examAlerts: v }))}
              />
              <ToggleRow
                title="Announcement Alerts"
                description="Push notifications for urgent school announcements."
                checked={prefs.announcementAlerts}
                onChange={(v) => setPrefs((p) => ({ ...p, announcementAlerts: v }))}
              />
            </div>

            <div className="mt-8 border-t border-slate-100 pt-5">
              <button type="button" onClick={handleSavePrefs} className={primaryBtn}>
                Save preferences
              </button>
            </div>
          </Card>
        )}

        {/* 4. DANGER ZONE */}
        {activeTab === "danger" && (
          <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
            <div className="border-b border-red-100 bg-red-50/30 px-6 py-5">
              <h2 className="text-base font-semibold text-red-700">Danger Zone</h2>
              <p className="mt-1 text-sm text-slate-500">Irreversible and destructive actions.</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Sign Out</h3>
                  <p className="mt-1 text-sm text-slate-500">Securely log out from your current session.</p>
                </div>
                <button type="button" onClick={handleSignOut} className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
                  Sign out
                </button>
              </div>
              <hr className="border-slate-100" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-red-700">Delete Account</h3>
                  <p className="mt-1 text-sm text-slate-500 max-w-md">Account deletion is restricted to preserve academic records. Contact administration.</p>
                </div>
                <button type="button" disabled className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-red-50 px-5 text-sm font-medium text-red-400 border border-red-100 cursor-not-allowed">
                  Request Deletion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- UI Helper Components ---------- */

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

function ToggleRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void; }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-2 last:pb-2">
      <div className="min-w-0 pr-4">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
          checked ? "bg-teal-600" : "bg-slate-200"
        }`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}