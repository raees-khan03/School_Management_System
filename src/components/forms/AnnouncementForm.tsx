"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  createAnnouncement,
  updateAnnouncement,
  getAnnouncementFormData,
} from "@/lib/actions/announcement";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
  classId: z.string().optional(),
});

type Inputs = z.infer<typeof schema>;

const toDateInput = (d?: Date | string) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const AnnouncementForm = ({
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
  const [classes, setClasses] = useState<any[]>([]);
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
      description: data?.description || "",
      date: toDateInput(data?.date),
      classId: data?.classId ? String(data.classId) : "",
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getAnnouncementFormData();
        setClasses(res.classes);
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
      description: formData.description.trim(),
      date: formData.date,
      classId: formData.classId ? Number(formData.classId) : null,
    };

    const result =
      type === "create"
        ? await createAnnouncement(payload)
        : await updateAnnouncement(Number(data.id), payload);

    if (!result.success) {
      setServerError(result.error || "Failed to save announcement.");
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
        {type === "create" ? "Add new announcement" : "Update announcement"}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Announcement Title *</label>
          <input {...register("title")} placeholder="Exam Schedule Released" className={inputClass(!!errors.title)} />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Description *</label>
          <textarea
            rows={3}
            {...register("description")}
            placeholder="Announcement details..."
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Target Class (Optional)</label>
          <select {...register("classId")} className={inputClass()}>
            <option value="">All Classes (Global Announcement)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Date *</label>
          <input type="date" {...register("date")} className={inputClass(!!errors.date)} />
          {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
        </div>
      </div>

      {serverError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-all"
      >
        {isSubmitting ? "Saving..." : type === "create" ? "Create Announcement" : "Update Announcement"}
      </button>
    </form>
  );
};

export default AnnouncementForm;