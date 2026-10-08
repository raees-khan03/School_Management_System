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
} from "lucide-react";

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
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "danger", label: "Danger zone", icon: TriangleAlert },
];

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const primaryBtn =
  "inline-flex h-10 items-center justify-center rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-50";

export default function SettingsClient({ user }: { user: UserData }) {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>("account");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Account
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [saving, setSaving] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Preferences
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const showMsg = (type: "success" | "error", text: string) => setMessage({ type, text });

  const profileChanged =
    firstName.trim() !== user.firstName || lastName.trim() !== user.lastName;

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
    <div className="space-y-6">
      {/* ===== TOP TABS (underline style, doosra sidebar nahi) ===== */}
      <div className="border-b border-slate-200">
        <nav
          className="-mb-px flex gap-1 overflow-x-auto sm:gap-4"
          aria-label="Settings sections"
        >
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            const isDanger = id === "danger";
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 pt-1 text-sm font-medium transition-colors ${
                  active
                    ? isDanger
                      ? "border-red-500 text-red-600"
                      : "border-teal-600 text-teal-700"
                    : isDanger
                    ? "border-transparent text-red-400 hover:border-red-200 hover:text-red-600"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ===== TOAST ===== */}
      {message && (
        <div
          role="status"
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
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

      {/* ===== 1. ACCOUNT ===== */}
      {activeTab === "account" && (
        <Card title="Account" description="Update your personal details.">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200 ring-offset-2">
              <Image
                src={user.imageUrl || "/noAvatar.png"}
                alt={user.fullName || "User"}
                fill
                sizes="64px"
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.fullName || "User"}
              </p>
              <span className="mt-1 inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium capitalize text-teal-700 ring-1 ring-inset ring-teal-600/20">
                {user.role}
              </span>
            </div>
          </div>

          <div className="grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="First name">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
                placeholder="First name"
              />
            </Field>
            <Field label="Last name">
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                placeholder="Last name"
              />
            </Field>
            <Field
              label="Email address"
              className="sm:col-span-2"
              hint="Email Clerk se manage hoti hai, yahan se change nahi ho sakti."
            >
              <input value={user.email} disabled className={inputClass} />
            </Field>
            <Field label="Username">
              <input value={user.username || "-"} disabled className={inputClass} />
            </Field>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving || !profileChanged}
              className={primaryBtn}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </Card>
      )}

      {/* ===== 2. SECURITY ===== */}
      {activeTab === "security" && (
        <Card title="Security" description="Change your password and manage your session.">
          {canChangePassword ? (
            <div className="max-w-md space-y-5">
              <Field label="Current password">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Current password"
                  autoComplete="current-password"
                />
              </Field>
              <Field label="New password" hint="Kam az kam 8 characters.">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  placeholder="New password"
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm new password">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
              </Field>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
                className={primaryBtn}
              >
                {pwLoading ? "Updating..." : "Update password"}
              </button>
            </div>
          ) : (
            <div className="flex max-w-xl items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                Aap social login (jaise Google) se sign in karte hain, is liye is account ka
                koi password nahi hai.
              </p>
            </div>
          )}

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold text-slate-900">Active session</h3>
            <p className="mb-3 mt-1 text-sm text-slate-500">
              Aap is device par sign in hain.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4 text-slate-400" />
              Sign out of this device
            </button>
          </div>
        </Card>
      )}

      {/* ===== 3. PREFERENCES ===== */}
      {activeTab === "preferences" && (
        <Card title="Preferences" description="Manage your notification settings.">
          <div className="max-w-3xl divide-y divide-slate-100">
            <ToggleRow
              title="Email notifications"
              description="Receive daily summaries and important updates."
              checked={prefs.emailNotifs}
              onChange={(v) => setPrefs((p) => ({ ...p, emailNotifs: v }))}
            />
            <ToggleRow
              title="Exam & assignment alerts"
              description="Get notified when new assignments or exams are posted."
              checked={prefs.examAlerts}
              onChange={(v) => setPrefs((p) => ({ ...p, examAlerts: v }))}
            />
            <ToggleRow
              title="Announcement alerts"
              description="Notify me about school announcements."
              checked={prefs.announcementAlerts}
              onChange={(v) => setPrefs((p) => ({ ...p, announcementAlerts: v }))}
            />
          </div>

          <div className="border-t border-slate-100 pt-5">
            <button type="button" onClick={handleSavePrefs} className={primaryBtn}>
              Save preferences
            </button>
            <p className="mt-3 text-xs text-slate-400">
              Ye settings abhi sirf is browser mein save hoti hain.
            </p>
          </div>
        </Card>
      )}

      {/* ===== 4. DANGER ZONE ===== */}
      {activeTab === "danger" && (
        <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
          <div className="border-b border-red-100 bg-red-50/40 px-6 py-5">
            <h2 className="text-base font-semibold text-red-700">Danger zone</h2>
            <p className="mt-1 text-sm text-slate-500">Ye actions sambhal kar karein.</p>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Sign out</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Is device par session khatam karo.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                Sign out
              </button>
            </div>

            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-red-700">Delete account</h3>
                <p className="mt-1 max-w-xl text-sm text-slate-500">
                  Academic records bachane ke liye self-delete band hai. Delete karwane ke liye
                  school administration se rabta karein.
                </p>
              </div>
              <button
                type="button"
                disabled
                className="inline-flex h-10 shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-red-100 bg-red-50 px-5 text-sm font-medium text-red-400"
              >
                Contact admin
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------- UI Helper Components ---------- */

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="space-y-6 p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 ${
          checked ? "bg-teal-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}