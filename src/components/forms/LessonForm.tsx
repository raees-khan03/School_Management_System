"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  createLesson,
  updateLesson,
  getLessonFormData,
  type LessonData,
} from "@/lib/actions/lesson";

const schema = z.object({
  name: z.string().min(1, "Lesson name is required"),
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]),
  startTime: z.string().min(1, "Start time required"),
  endTime: z.string().min(1, "End time required"),
  subjectId: z.coerce.number().min(1, "Subject required"),
  classId: z.coerce.number().min(1, "Class required"),
  teacherId: z.string().min(1, "Teacher required"),
});

type Inputs = z.input<typeof schema>;

const toTimeInput = (d?: Date | string) => {
  if (!d) return "";
  if (typeof d === "string") {
    if (/^\d{2}:\d{2}/.test(d)) return d.slice(0, 5);
    if (d.includes("T")) {
      const dt = new Date(d);
      if (!isNaN(dt.getTime())) {
        return dt.toTimeString().slice(0, 5);
      }
    }
  }
  const dt = new Date(d);
  if (!isNaN(dt.getTime())) {
    return dt.toTimeString().slice(0, 5);
  }
  return "";
};

const LessonForm = ({
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
  const [options, setOptions] = useState<{
    subjects: { id: number; name: string }[];
    classes: { id: number; name: string }[];
    teachers: { id: string; name: string; surname: string }[];
  }>({ subjects: [], classes: [], teachers: [] });
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data?.name || "",
      day: data?.day || "MONDAY",
      startTime: toTimeInput(data?.startTime),
      endTime: toTimeInput(data?.endTime),
      subjectId: data?.subjectId ? Number(data.subjectId) : undefined,
      classId: data?.classId ? Number(data.classId) : undefined,
      teacherId: data?.teacherId || "",
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getLessonFormData();
        setOptions(res);
      } catch {
        setServerError("Failed to load options.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ✅ Fix: Parameter se ": Inputs" hata diya hai, RHF ise khud automatically infer karega
  const onSubmit = handleSubmit(async (formData) => {
    setServerError("");

    const payload: LessonData = {
      name: formData.name.trim(),
      day: formData.day,
      startTime: formData.startTime,
      endTime: formData.endTime,
      subjectId: Number(formData.subjectId),
      classId: Number(formData.classId),
      teacherId: formData.teacherId,
    };

    const result =
      type === "create"
        ? await createLesson(payload)
        : await updateLesson(Number(data.id), payload);

    if (!result.success) {
      setServerError(result.error || "Failed to save lesson.");
      return;
    }
    reset();
    router.refresh();
    onSuccess?.();
  });

  const inputClass = (e?: boolean) =>
    `w-full h-11 rounded-xl border bg-white px-3.5 text-sm outline-none transition-all focus:ring-4 ${
      e
        ? "border-red-300 focus:ring-red-500/10"
        : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
    }`;

  if (loading)
    return <p className="p-4 text-center text-slate-500">Loading form options...</p>;

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-slate-900">
        {type === "create" ? "Add new lesson" : "Update lesson"}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Lesson name *</label>
          <input
            {...register("name")}
            placeholder="Math - Period 1"
            className={inputClass(!!errors.name)}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Subject *</label>
          <select
            {...register("subjectId")}
            className={inputClass(!!errors.subjectId)}
          >
            <option value="">Select subject</option>
            {options.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.subjectId && (
            <p className="text-xs text-red-500">{errors.subjectId.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Class *</label>
          <select
            {...register("classId")}
            className={inputClass(!!errors.classId)}
          >
            <option value="">Select class</option>
            {options.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.classId && (
            <p className="text-xs text-red-500">{errors.classId.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Teacher *</label>
          <select
            {...register("teacherId")}
            className={inputClass(!!errors.teacherId)}
          >
            <option value="">Select teacher</option>
            {options.teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.surname}
              </option>
            ))}
          </select>
          {errors.teacherId && (
            <p className="text-xs text-red-500">{errors.teacherId.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Day *</label>
          <select {...register("day")} className={inputClass(!!errors.day)}>
            {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"].map(
              (d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              )
            )}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Start time *</label>
          <input
            type="time"
            {...register("startTime")}
            className={inputClass(!!errors.startTime)}
          />
          {errors.startTime && (
            <p className="text-xs text-red-500">{errors.startTime.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">End time *</label>
          <input
            type="time"
            {...register("endTime")}
            className={inputClass(!!errors.endTime)}
          />
          {errors.endTime && (
            <p className="text-xs text-red-500">{errors.endTime.message}</p>
          )}
        </div>
      </div>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-all"
      >
        {isSubmitting
          ? "Saving..."
          : type === "create"
          ? "Create Lesson"
          : "Update Lesson"}
      </button>
    </form>
  );
};

export default LessonForm;