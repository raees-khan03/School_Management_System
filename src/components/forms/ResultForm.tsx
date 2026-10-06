"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { createResult, updateResult, getResultFormData } from "@/lib/actions/result";

const schema = z.object({
  score: z.coerce.number().min(0, "Score must be positive"),
  studentId: z.string().min(1, "Student is required"),
  examId: z.string().optional(),
  assignmentId: z.string().optional(),
});

type Inputs = z.input<typeof schema>;

const ResultForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}) => {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [options, setOptions] = useState<{ students: any[]; exams: any[]; assignments: any[] }>({
    students: [],
    exams: [],
    assignments: [],
  });
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      score: data?.score || 0,
      studentId: data?.studentId || "",
      examId: data?.examId ? String(data.examId) : "",
      assignmentId: data?.assignmentId ? String(data.assignmentId) : "",
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getResultFormData();
        setOptions(res);
      } catch {
        setServerError("Failed to load options.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSubmit = handleSubmit(async (formData) => {
    setServerError("");
    const payload = {
      score: Number(formData.score),
      studentId: formData.studentId,
      examId: formData.examId ? Number(formData.examId) : null,
      assignmentId: formData.assignmentId ? Number(formData.assignmentId) : null,
    };

    const result =
      type === "create"
        ? await createResult(payload)
        : await updateResult(Number(data.id), payload);

    if (!result.success) {
      setServerError(result.error || "Failed to save result.");
      return;
    }
    reset();
    router.refresh();
    onSuccess?.();
  });

  const inputClass = (e?: boolean) =>
    `w-full h-11 rounded-xl border bg-white px-3.5 text-sm outline-none transition-all focus:ring-4 ${
      e ? "border-red-300 focus:ring-red-500/10" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
    }`;

  if (loading) return <p className="p-4 text-center text-slate-500">Loading form...</p>;

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-slate-900">
        {type === "create" ? "Add new result" : "Update result"}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Student *</label>
          <select {...register("studentId")} className={inputClass(!!errors.studentId)}>
            <option value="">Select student</option>
            {options.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.surname}
              </option>
            ))}
          </select>
          {errors.studentId && <p className="text-xs text-red-500">{errors.studentId.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Exam (Optional)</label>
          <select {...register("examId")} className={inputClass()}>
            <option value="">Select exam</option>
            {options.exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Assignment (Optional)</label>
          <select {...register("assignmentId")} className={inputClass()}>
            <option value="">Select assignment</option>
            {options.assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Score *</label>
          <input type="number" {...register("score")} className={inputClass(!!errors.score)} />
          {errors.score && <p className="text-xs text-red-500">{errors.score.message}</p>}
        </div>
      </div>

      {serverError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-all"
      >
        {isSubmitting ? "Saving..." : type === "create" ? "Create Result" : "Update Result"}
      </button>
    </form>
  );
};

export default ResultForm;