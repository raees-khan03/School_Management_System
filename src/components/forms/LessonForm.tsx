"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import {
  createLesson,
  updateLesson,
  getLessonFormData,
} from "@/lib/actions/lesson";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;

const schema = z.object({
  name: z.string().trim().min(1, "Lesson name is required"),
  day: z.enum(DAYS),
  startTime: z.string().min(1, "Start time required"),
  endTime: z.string().min(1, "End time required"),
  subjectId: z.string().min(1, "Select a subject"),
  classId: z.string().min(1, "Select a class"),
  teacherId: z.string().min(1, "Select a teacher"),
});

type Inputs = z.input<typeof schema>;

const toTimeInput = (d?: Date | string | null) => {
  if (!d) return "";
  if (typeof d === "string" && /^\d{2}:\d{2}/.test(d)) return d.slice(0, 5);
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const inputClass = (err?: boolean) =>
  `h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    err
      ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
      : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/15"
  }`;

type Props = {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
};

export default function LessonForm({ type, data, onSuccess }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [options, setOptions] = useState<{
    subjects: any[];
    classes: any[];
    teachers: any[];
  }>({ subjects: [], classes: [], teachers: [] });
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [relatedError, setRelatedError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data?.name || "",
      day: data?.day || "MONDAY",
      startTime: toTimeInput(data?.startTime),
      endTime: toTimeInput(data?.endTime),
      subjectId: data?.subjectId ? String(data.subjectId) : "",
      classId: data?.classId ? String(data.classId) : "",
      teacherId: data?.teacherId || "",
    },
  });

  const loadRelated = useCallback(async () => {
    setLoadingRelated(true);
    setRelatedError(false);
    try {
      setOptions(await getLessonFormData());
    } catch {
      setRelatedError(true);
    } finally {
      setLoadingRelated(false);
    }
  }, []);

  useEffect(() => {
    loadRelated();
  }, [loadRelated]);

  const onSubmit = handleSubmit(async (formData) => {
    setServerError("");
    const payload = {
      name: formData.name.trim(),
      day: formData.day,
      startTime: formData.startTime,
      endTime: formData.endTime,
      subjectId: Number(formData.subjectId),
      classId: Number(formData.classId),
      teacherId: formData.teacherId,
    };

    try {
      const result =
        type === "create"
          ? await createLesson(payload as any)
          : await updateLesson(Number(data.id), payload as any);

      if (!result.success) {
        setServerError(result.error || "Failed to save lesson.");
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
        <p className="text-sm text-slate-600">Could not load subjects, classes and teachers.</p>
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

  const busy = isSubmitting;
  const nothingChanged = type === "update" && !isDirty;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {type === "create" ? "Add new lesson" : "Update lesson"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Schedule a subject for a class on a specific day.
        </p>
      </div>

      <Section title="Lesson">
        <Field label="Lesson name" required error={errors.name?.message} className="sm:col-span-2">
          <input
            {...register("name")}
            className={inputClass(!!errors.name)}
            placeholder="e.g. Math - Period 1"
          />
        </Field>
        <Field label="Subject" required error={errors.subjectId?.message}>
          <select {...register("subjectId")} className={inputClass(!!errors.subjectId)}>
            <option value="">Select subject</option>
            {options.subjects.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Class" required error={errors.classId?.message}>
          <select {...register("classId")} className={inputClass(!!errors.classId)}>
            <option value="">Select class</option>
            {options.classes.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Teacher" required error={errors.teacherId?.message}>
          <select {...register("teacherId")} className={inputClass(!!errors.teacherId)}>
            <option value="">Select teacher</option>
            {options.teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.surname}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Day" required error={errors.day?.message}>
          <select {...register("day")} className={inputClass(!!errors.day)}>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d.charAt(0) + d.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start time" required error={errors.startTime?.message}>
          <input type="time" {...register("startTime")} className={inputClass(!!errors.startTime)} />
        </Field>
        <Field label="End time" required error={errors.endTime?.message}>
          <input type="time" {...register("endTime")} className={inputClass(!!errors.endTime)} />
        </Field>
      </Section>

      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      <div className="border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={busy || nothingChanged}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Saving..." : type === "create" ? "Create lesson" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-slate-100 pt-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
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