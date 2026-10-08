"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  createAttendance,
  updateAttendance,
  getAttendanceFormData,
  bulkMarkAttendance,
} from "@/lib/actions/attendance";

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  present: z.enum(["true", "false"]),
  studentId: z.string().min(1, "Select a student"),
  lessonId: z.string().min(1, "Select a lesson"),
});

type Inputs = z.input<typeof schema>;

type StudentOpt = {
  id: string;
  name: string;
  surname: string;
  classId: number;
  class: { name: string } | null;
};

type LessonOpt = {
  id: number;
  name: string;
  day: string;
  classId: number;
  subject: { name: string } | null;
  class: { name: string } | null;
};

const inputClass = (err?: boolean) =>
  `h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:ring-4 ${
    err
      ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
      : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/15"
  }`;

type Props = {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
};

export default function AttendanceForm({ type, data, onSuccess }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "bulk">(
    type === "update" ? "single" : "bulk"
  );
  const [serverError, setServerError] = useState("");
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [lessons, setLessons] = useState<LessonOpt[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [relatedError, setRelatedError] = useState(false);

  const [bulkLessonId, setBulkLessonId] = useState<string>("");
  const [bulkDate, setBulkDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [bulkSaving, setBulkSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: data?.date
        ? new Date(data.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      present: data?.present === false ? "false" : "true",
      studentId: data?.studentId || "",
      lessonId: data?.lessonId ? String(data.lessonId) : "",
    },
  });

  const loadRelated = useCallback(async () => {
    setLoadingRelated(true);
    setRelatedError(false);
    try {
      const res = await getAttendanceFormData();
      setStudents(res.students as StudentOpt[]);
      setLessons(res.lessons as LessonOpt[]);
    } catch {
      setRelatedError(true);
    } finally {
      setLoadingRelated(false);
    }
  }, []);

  useEffect(() => {
    loadRelated();
  }, [loadRelated]);

  const selectedBulkLesson = useMemo(
    () => lessons.find((l) => String(l.id) === bulkLessonId),
    [lessons, bulkLessonId]
  );

  const bulkStudents = useMemo(() => {
    if (!selectedBulkLesson) return [];
    return students.filter((s) => s.classId === selectedBulkLesson.classId);
  }, [students, selectedBulkLesson]);

  useEffect(() => {
    if (!selectedBulkLesson) {
      setMarks({});
      return;
    }
    const next: Record<string, boolean> = {};
    bulkStudents.forEach((s) => {
      next[s.id] = marks[s.id] ?? true;
    });
    setMarks(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkLessonId, bulkStudents.length]);

  const onSubmitSingle = handleSubmit(async (formData) => {
    setServerError("");
    const payload = {
      date: formData.date,
      present: formData.present === "true",
      studentId: formData.studentId,
      lessonId: Number(formData.lessonId),
    };

    try {
      const result =
        type === "create"
          ? await createAttendance(payload as any)
          : await updateAttendance(Number(data.id), payload as any);

      if (!result.success) {
        setServerError(result.error || "Failed to save.");
        return;
      }
      if (type === "create") reset();
      router.refresh();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setServerError("Something went wrong. Please try again.");
    }
  });

  const onSubmitBulk = async () => {
    setServerError("");
    if (!bulkLessonId || !bulkDate) {
      setServerError("Select a lesson and date.");
      return;
    }
    if (bulkStudents.length === 0) {
      setServerError("No students found in this lesson's class.");
      return;
    }

    setBulkSaving(true);
    try {
      const records = bulkStudents.map((s) => ({
        studentId: s.id,
        present: marks[s.id] ?? true,
      }));

      const result = await bulkMarkAttendance({
        lessonId: Number(bulkLessonId),
        date: bulkDate,
        records,
      });

      if (!result.success) {
        setServerError(result.error || "Failed to save bulk attendance.");
        return;
      }
      router.refresh();
      onSuccess?.();
    } finally {
      setBulkSaving(false);
    }
  };

  if (loadingRelated) {
    return (
      <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading form options...
      </div>
    );
  }

  if (relatedError) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle className="h-5 w-5" />
        </span>
        <p className="text-sm text-slate-600">Could not load students and lessons.</p>
        <button
          type="button"
          onClick={loadRelated}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {type === "update"
            ? "Update attendance"
            : mode === "bulk"
            ? "Mark class attendance"
            : "Mark single attendance"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {type === "update"
            ? "Edit an existing attendance record."
            : "Select a lesson and mark students present or absent."}
        </p>
      </div>

      {type === "create" && (
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setMode("bulk")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              mode === "bulk"
                ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Class bulk mark
          </button>
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              mode === "single"
                ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Single student
          </button>
        </div>
      )}

      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      {/* BULK MODE */}
      {mode === "bulk" && type === "create" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Lesson" required>
              <select
                value={bulkLessonId}
                onChange={(e) => setBulkLessonId(e.target.value)}
                className={inputClass()}
              >
                <option value="">Select lesson</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.subject?.name || l.name} — {l.class?.name} ({l.day})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date" required>
              <input
                type="date"
                value={bulkDate}
                onChange={(e) => setBulkDate(e.target.value)}
                className={inputClass()}
              />
            </Field>
          </div>

          {selectedBulkLesson && (
            <p className="text-xs text-slate-500">
              Class{" "}
              <span className="font-semibold text-slate-700">
                {selectedBulkLesson.class?.name}
              </span>{" "}
              · {bulkStudents.length} student
              {bulkStudents.length === 1 ? "" : "s"}
            </p>
          )}

          {bulkLessonId && bulkStudents.length === 0 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              No students enrolled in this class yet.
            </p>
          )}

          {bulkStudents.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
              <ul className="divide-y divide-slate-100">
                {bulkStudents.map((s) => {
                  const present = marks[s.id] ?? true;
                  return (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <span className="text-sm font-medium text-slate-800">
                        {s.name} {s.surname}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setMarks((m) => ({ ...m, [s.id]: true }))}
                          className={`inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset transition ${
                            present
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => setMarks((m) => ({ ...m, [s.id]: false }))}
                          className={`inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset transition ${
                            !present
                              ? "bg-red-50 text-red-700 ring-red-600/20"
                              : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Absent
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onSubmitBulk}
              disabled={bulkSaving || !bulkLessonId || bulkStudents.length === 0}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {bulkSaving ? "Saving..." : "Save attendance"}
            </button>
          </div>
        </div>
      )}

      {/* SINGLE MODE */}
      {(mode === "single" || type === "update") && (
        <form className="flex flex-col gap-4" onSubmit={onSubmitSingle} noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Lesson"
              required
              error={errors.lessonId?.message}
              className="sm:col-span-2"
            >
              <select {...register("lessonId")} className={inputClass(!!errors.lessonId)}>
                <option value="">Select lesson</option>
                {lessons.map((l) => (
                  <option key={l.id} value={String(l.id)}>
                    {l.subject?.name || l.name} — {l.class?.name} ({l.day})
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Student"
              required
              error={errors.studentId?.message}
              className="sm:col-span-2"
            >
              <select {...register("studentId")} className={inputClass(!!errors.studentId)}>
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.surname}
                    {s.class?.name ? ` (${s.class.name})` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date" required error={errors.date?.message}>
              <input type="date" {...register("date")} className={inputClass(!!errors.date)} />
            </Field>
            <Field label="Status" required>
              <select {...register("present")} className={inputClass()}>
                <option value="true">Present</option>
                <option value="false">Absent</option>
              </select>
            </Field>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={isSubmitting || (type === "update" && !isDirty)}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? "Saving..."
                : type === "create"
                ? "Save attendance"
                : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  error,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}