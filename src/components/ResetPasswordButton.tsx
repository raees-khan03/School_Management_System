"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import { resetTeacherPassword } from "@/lib/actions/teacher";
import { resetStudentPassword } from "@/lib/actions/student";
import { resetParentPassword } from "@/lib/actions/parent";

type Table = "teacher" | "student" | "parent";

const resetActions = {
  teacher: resetTeacherPassword,
  student: resetStudentPassword,
  parent: resetParentPassword,
};

const MIN_PASSWORD = 16;
const MAX_PASSWORD = 72;

const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
  const bytes = crypto.getRandomValues(new Uint32Array(MIN_PASSWORD));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

export default function ResetPasswordButton({
  id,
  name,
  table = "teacher",
}: {
  id: string;
  name?: string;
  table?: Table;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const close = () => {
    setOpen(false);
    setPassword("");
    setShow(false);
    setError("");
    setDone(false);
  };

  const submit = async () => {
    setError("");
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password.length > MAX_PASSWORD) {
      setError(`Password must be at most ${MAX_PASSWORD} characters.`);
      return;
    }
    setLoading(true);
    try {
      const res = await resetActions[table](id, password);
      if (!res.success) {
        setError(res.error || "Failed to reset password.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Reset password"
        aria-label="Reset password"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
      >
        <KeyRound className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Reset password</h3>
                {name && <p className="text-sm text-slate-500">{name}</p>}
              </div>
              <button onClick={close} aria-label="Close" className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {done ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  Password updated. All other active sessions have been signed out.
                </div>
                <button
                  onClick={close}
                  className="h-10 w-full rounded-lg bg-teal-600 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={`New password (min ${MIN_PASSWORD})`}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3.5 pr-10 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPassword(generatePassword());
                    setShow(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline"
                >
                  <KeyRound className="h-4 w-4" />
                  Generate strong password
                </button>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={loading}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Updating..." : "Update password"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}