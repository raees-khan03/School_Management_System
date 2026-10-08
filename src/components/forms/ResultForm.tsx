"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { createResult, updateResult, getResultFormData } from "@/lib/actions/result";

const schema = z
  .object({
    score: z
      .string()
      .min(1, "Score is required")
      .refine((v) => Number(v) >= 0, "Score cannot be negative"),
    studentId: z.string().min(1, "Select a student"),
    examId: z.string().optional(),
    assignmentId: z.string().optional(),
  })
  .refine((v) => v.examId || v.assignmentId, {
    message: "Select an exam or assignment",
    path: ["examId"],
  });

type Inputs = z.input<typeof schema>;

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

export default function ResultForm({ type, data, onSuccess }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [options, setOptions] = useState<{
    students: any[];
    exams: any[];
    assignments: any[];
  }>({ students: [], exams: [], assignments: [] });
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
      score: data?.score != null ? String(data.score) : "",
      studentId: data?.studentId || "",
      examId: data?.examId ? String(data.examId) : "",
      assignmentId: data?.assignmentId ? String(data.assignmentId) : "",
    },
  });

  const loadRelated = useCallback(async () => {
    setLoadingRelated(true);
    setRelatedError(false);
    try {
      setOptions(await getResultFormData());
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
      score: Number(formData.score),
      studentId: formData.studentId,
      examId: formData.examId ? Number(formData.examId) : null,
      assignmentId: formData.assignmentId ? Number(formData.assignmentId) : null,
    };

    try {
      const result =
        type === "create"
          ? await createResult(payload as any)
          : await updateResult(Number(data.id), payload as any);

      if (!result.success) {
        setServerError(result.error || "Failed to save result.");
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
        <p className="text-sm text-slate-600">Could not load students, exams and assignments.</p>
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
          {type === "create" ? "Add new result" : "Update result"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Record a score for an exam or assignment.
        </p>
      </div>

      <Section title="Result">
        <Field label="Student" required error={errors.studentId?.message} className="sm:col-span-2">
          <select {...register("studentId")} className={inputClass(!!errors.studentId)}>
            <option value="">Select student</option>
            {options.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.surname}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Exam" error={errors.examId?.message}>
          <select {...register("examId")} className={inputClass(!!errors.examId)}>
            <option value="">None</option>
            {options.exams.map((e) => (
              <option key={e.id} value={String(e.id)}>
                {e.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Assignment">
          <select {...register("assignmentId")} className={inputClass()}>
            <option value="">None</option>
            {options.assignments.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Score" required error={errors.score?.message} className="sm:col-span-2">
          <input
            type="number"
            min={0}
            {...register("score")}
            className={`${inputClass(!!errors.score)} tabular-nums`}
          />
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
          {isSubmitting ? "Saving..." : type === "create" ? "Create result" : "Save changes"}
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