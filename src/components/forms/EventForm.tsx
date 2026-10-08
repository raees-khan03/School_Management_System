"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { createEvent, updateEvent, getEventFormData } from "@/lib/actions/event";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  classId: z.string().optional(),
});

type Inputs = z.input<typeof schema>;

const toDateTimeLocal = (d?: Date | string | null) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

export default function EventForm({ type, data, onSuccess }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
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
      title: data?.title || "",
      description: data?.description || "",
      startTime: toDateTimeLocal(data?.startTime),
      endTime: toDateTimeLocal(data?.endTime),
      classId: data?.classId ? String(data.classId) : "",
    },
  });

  const loadRelated = useCallback(async () => {
    setLoadingRelated(true);
    setRelatedError(false);
    try {
      setClasses((await getEventFormData()).classes);
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
      title: formData.title.trim(),
      description: formData.description.trim(),
      startTime: formData.startTime,
      endTime: formData.endTime,
      classId: formData.classId ? Number(formData.classId) : null,
    };

    try {
      const result =
        type === "create"
          ? await createEvent(payload as any)
          : await updateEvent(Number(data.id), payload as any);

      if (!result.success) {
        setServerError(result.error || "Failed to save event.");
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
        <p className="text-sm text-slate-600">Could not load classes.</p>
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
          {type === "create" ? "Add new event" : "Update event"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          School-wide or class-specific event.
        </p>
      </div>

      <Section title="Event">
        <Field label="Title" required error={errors.title?.message} className="sm:col-span-2">
          <input {...register("title")} className={inputClass(!!errors.title)} placeholder="Annual picnic" />
        </Field>
        <Field label="Description" required error={errors.description?.message} className="sm:col-span-2">
          <textarea
            rows={3}
            {...register("description")}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
            placeholder="Event details..."
          />
        </Field>
        <Field label="Target class" className="sm:col-span-2">
          <select {...register("classId")} className={inputClass()}>
            <option value="">All classes (global)</option>
            {classes.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start" required error={errors.startTime?.message}>
          <input type="datetime-local" {...register("startTime")} className={inputClass(!!errors.startTime)} />
        </Field>
        <Field label="End" required error={errors.endTime?.message}>
          <input type="datetime-local" {...register("endTime")} className={inputClass(!!errors.endTime)} />
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
          {isSubmitting ? "Saving..." : type === "create" ? "Create event" : "Save changes"}
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