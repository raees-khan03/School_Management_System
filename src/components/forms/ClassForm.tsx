"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import {
  createClass,
  updateClass,
  getClassFormData,
} from "@/lib/actions/class";

const schema = z.object({
  name: z.string().trim().min(1, "Class name is required"),
  capacity: z
    .string()
    .min(1, "Capacity is required")
    .refine((v) => Number(v) >= 1, "Capacity must be at least 1"),
  gradeId: z.string().min(1, "Select a grade"),
  supervisorId: z.string().optional(),
});

type Inputs = z.input<typeof schema>;

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

export default function ClassForm({ type, data, onSuccess }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [options, setOptions] = useState<{ grades: any[]; teachers: any[] }>({
    grades: [],
    teachers: [],
  });
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
      capacity: data?.capacity ? String(data.capacity) : "25",
      gradeId: data?.gradeId ? String(data.gradeId) : "",
      supervisorId: data?.supervisorId || "",
    },
  });

  const loadRelated = useCallback(async () => {
    setLoadingRelated(true);
    setRelatedError(false);
    try {
      setOptions(await getClassFormData());
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
      capacity: Number(formData.capacity),
      gradeId: Number(formData.gradeId),
      supervisorId: formData.supervisorId || undefined,
    };

    try {
      const result =
        type === "create"
          ? await createClass(payload as any)
          : await updateClass(Number(data.id), payload as any);

      if (!result.success) {
        setServerError(result.error || "Failed to save class.");
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
        <p className="text-sm text-slate-600">Could not load grades and teachers.</p>
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
          {type === "create" ? "Add new class" : "Update class"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Fields marked with <span className="text-red-500">*</span> are required.
        </p>
      </div>

      <Section title="Class details">
        <Field label="Class name" required error={errors.name?.message}>
          <input
            {...register("name")}
            className={inputClass(!!errors.name)}
            placeholder="e.g. 10A"
          />
        </Field>
        <Field label="Capacity" required error={errors.capacity?.message}>
          <input
            type="number"
            min={1}
            {...register("capacity")}
            className={inputClass(!!errors.capacity)}
          />
        </Field>
        <Field label="Grade" required error={errors.gradeId?.message}>
          <select {...register("gradeId")} className={inputClass(!!errors.gradeId)}>
            <option value="">Select grade</option>
            {options.grades.map((g) => (
              <option key={g.id} value={String(g.id)}>
                Grade {g.level}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Supervisor">
          <select {...register("supervisorId")} className={inputClass()}>
            <option value="">No supervisor</option>
            {options.teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.surname}
              </option>
            ))}
          </select>
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
          {isSubmitting ? "Saving..." : type === "create" ? "Create class" : "Save changes"}
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