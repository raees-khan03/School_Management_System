"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import {
  createSubject,
  updateSubject,
  getSubjectFormData,
} from "@/lib/actions/subject";

const schema = z.object({
  name: z.string().trim().min(1, "Subject name is required"),
  teacherIds: z.array(z.string()).optional(),
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

export default function SubjectForm({ type, data, onSuccess }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [teachers, setTeachers] = useState<
    { id: string; name: string; surname: string }[]
  >([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [relatedError, setRelatedError] = useState(false);

  const initialTeacherIds: string[] = data?.teachers?.map((t: any) => t.id) || [];
  const [selectedTeachers, setSelectedTeachers] =
    useState<string[]>(initialTeacherIds);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data?.name || "",
      teacherIds: initialTeacherIds,
    },
  });

  const loadRelated = useCallback(async () => {
    setLoadingRelated(true);
    setRelatedError(false);
    try {
      const res = await getSubjectFormData();
      setTeachers(res.teachers);
    } catch {
      setRelatedError(true);
    } finally {
      setLoadingRelated(false);
    }
  }, []);

  useEffect(() => {
    loadRelated();
  }, [loadRelated]);

  const toggleTeacher = (id: string) => {
    setSelectedTeachers((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const teachersChanged =
    JSON.stringify([...selectedTeachers].sort()) !==
    JSON.stringify([...initialTeacherIds].sort());

  const onSubmit = handleSubmit(async (formData) => {
    setServerError("");
    const payload = {
      name: formData.name.trim(),
      teacherIds: selectedTeachers,
    };

    try {
      const result =
        type === "create"
          ? await createSubject(payload)
          : await updateSubject(Number(data.id), payload);

      if (!result.success) {
        setServerError(result.error || "Failed to save subject.");
        return;
      }

      if (type === "create") {
        reset();
        setSelectedTeachers([]);
      }
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
        <p className="text-sm text-slate-600">Could not load teachers.</p>
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
  const nothingChanged = type === "update" && !isDirty && !teachersChanged;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {type === "create" ? "Add new subject" : "Update subject"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Assign teachers who can teach this subject.
        </p>
      </div>

      <Section title="Subject details">
        <Field
          label="Subject name"
          required
          error={errors.name?.message}
          className="sm:col-span-2"
        >
          <input
            {...register("name")}
            placeholder="e.g. Mathematics"
            className={inputClass(!!errors.name)}
          />
        </Field>
      </Section>

      <Section title={`Assigned teachers (${selectedTeachers.length})`}>
        <div className="sm:col-span-2">
          {teachers.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              No teachers available. Create a teacher first.
            </p>
          ) : (
            <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/40 p-2">
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {teachers.map((t) => {
                  const checked = selectedTeachers.includes(t.id);
                  return (
                    <li key={t.id}>
                      <label
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition ${
                          checked
                            ? "border-teal-500 bg-teal-50 text-teal-800 ring-1 ring-teal-500/20"
                            : "border-transparent bg-white text-slate-700 hover:border-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTeacher(t.id)}
                          className="h-4 w-4 rounded border-slate-300 text-teal-600 accent-teal-600 focus:ring-teal-500"
                        />
                        <span className="truncate">
                          {t.name} {t.surname}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
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
          {isSubmitting
            ? "Saving..."
            : type === "create"
            ? "Create subject"
            : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-slate-100 pt-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        {title}
      </h3>
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