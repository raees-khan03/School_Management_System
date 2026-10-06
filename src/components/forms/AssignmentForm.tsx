"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  createAssignment,
  updateAssignment,
  getAssignmentFormData,
} from "@/lib/actions/assignment";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  startDate: z.string().min(1, "Start date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  lessonId: z.coerce.number().min(1, "Lesson is required"),
});

type Inputs = z.input<typeof schema>;

const toDateTimeInput = (d?: Date | string) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

const AssignmentForm = ({
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
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: data?.title || "",
      startDate: toDateTimeInput(data?.startDate),
      dueDate: toDateTimeInput(data?.dueDate),
      lessonId: data?.lessonId ? Number(data.lessonId) : undefined,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getAssignmentFormData();
        setLessons(res.lessons);
      } catch {
        setServerError("Failed to load options.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSubmit = handleSubmit(async (formData) => {
    setServerError("");

    // ✅ Explicit payload object banana TypeScript type mismatch ko solve karta hai
    const payload = {
      title: formData.title.trim(),
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      lessonId: Number(formData.lessonId),
    };

    const result =
      type === "create"
        ? await createAssignment(payload)
        : await updateAssignment(Number(data.id), payload);

    if (!result.success) {
      setServerError(result.error || "Failed to save assignment.");
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
        {type === "create" ? "Add new assignment" : "Update assignment"}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Assignment Title *</label>
          <input {...register("title")} placeholder="Chapter 1 Homework" className={inputClass(!!errors.title)} />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Lesson *</label>
          <select {...register("lessonId")} className={inputClass(!!errors.lessonId)}>
            <option value="">Select lesson</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name || l.subject?.name} - ({l.class?.name})
              </option>
            ))}
          </select>
          {errors.lessonId && <p className="text-xs text-red-500">{errors.lessonId.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Start Date *</label>
          <input type="datetime-local" {...register("startDate")} className={inputClass(!!errors.startDate)} />
          {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Due Date *</label>
          <input type="datetime-local" {...register("dueDate")} className={inputClass(!!errors.dueDate)} />
          {errors.dueDate && <p className="text-xs text-red-500">{errors.dueDate.message}</p>}
        </div>
      </div>

      {serverError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-all"
      >
        {isSubmitting ? "Saving..." : type === "create" ? "Create Assignment" : "Update Assignment"}
      </button>
    </form>
  );
};

export default AssignmentForm;