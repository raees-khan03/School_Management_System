"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { createExam, updateExam, getExamFormData } from "@/lib/actions/exam";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  lessonId: z.coerce.number().min(1, "Lesson is required"),
});

type Inputs = z.infer<typeof schema>;

const toDateTimeInput = (d?: Date | string) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

const ExamForm = ({
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
      startTime: toDateTimeInput(data?.startTime),
      endTime: toDateTimeInput(data?.endTime),
      lessonId: data?.lessonId ? Number(data.lessonId) : undefined,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getExamFormData();
        setLessons(res.lessons);
      } catch {
        setServerError("Failed to load options.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ✅ Fix: Explicit typing (formData: Inputs) + Payload Object
  const onSubmit = handleSubmit(async (formData: Inputs) => {
    setServerError("");

    const payload = {
      title: formData.title.trim(),
      startTime: formData.startTime,
      endTime: formData.endTime,
      lessonId: Number(formData.lessonId),
    };

    const result =
      type === "create"
        ? await createExam(payload)
        : await updateExam(Number(data.id), payload);

    if (!result.success) {
      setServerError(result.error || "Failed to save exam.");
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
        {type === "create" ? "Add new exam" : "Update exam"}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Exam Title *</label>
          <input {...register("title")} placeholder="Midterm Exam" className={inputClass(!!errors.title)} />
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
          <label className="text-sm font-medium text-slate-700">Start Time *</label>
          <input type="datetime-local" {...register("startTime")} className={inputClass(!!errors.startTime)} />
          {errors.startTime && <p className="text-xs text-red-500">{errors.startTime.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">End Time *</label>
          <input type="datetime-local" {...register("endTime")} className={inputClass(!!errors.endTime)} />
          {errors.endTime && <p className="text-xs text-red-500">{errors.endTime.message}</p>}
        </div>
      </div>

      {serverError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-all"
      >
        {isSubmitting ? "Saving..." : type === "create" ? "Create Exam" : "Update Exam"}
      </button>
    </form>
  );
};

export default ExamForm;