"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { createClass, updateClass, getClassFormData } from "@/lib/actions/class";

const schema = z.object({
  name: z.string().min(1, "Class name is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  gradeId: z.coerce.number().min(1, "Grade is required"),
  supervisorId: z.string().optional(),
});

type Inputs = z.input<typeof schema>;

const ClassForm = ({
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
  const [grades, setGrades] = useState<{ id: number; level: number }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string; surname: string }[]>([]);
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
      capacity: data?.capacity || 25,
      gradeId: data?.gradeId || undefined,
      supervisorId: data?.supervisorId || "",
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getClassFormData();
        setGrades(res.grades);
        setTeachers(res.teachers);
      } catch {
        setServerError("Failed to load form data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSubmit = handleSubmit(async (formData) => {
    setServerError("");
    const payload = {
      name: formData.name.trim(),
      capacity: Number(formData.capacity),
      gradeId: Number(formData.gradeId),
      supervisorId: formData.supervisorId || undefined,
    };

    const result =
      type === "create"
        ? await createClass(payload)
        : await updateClass(Number(data.id), payload);

    if (!result.success) {
      setServerError(result.error || "Failed to save class.");
      return;
    }

    reset();
    router.refresh();
    onSuccess?.();
  });

  const inputClass = (hasError?: boolean) =>
    `w-full h-11 rounded-xl border bg-white px-3.5 text-sm outline-none focus:ring-4 ${
      hasError
        ? "border-red-300 focus:ring-red-500/10"
        : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
    }`;

  if (loading) return <p className="p-4 text-center text-slate-500">Loading...</p>;

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <div>
        <h1 className="text-xl font-semibold">
          {type === "create" ? "Add new class" : "Update class"}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Class name *</label>
          <input placeholder="1A" {...register("name")} className={inputClass(!!errors.name)} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Capacity *</label>
          <input type="number" {...register("capacity")} className={inputClass(!!errors.capacity)} />
          {errors.capacity && <p className="text-xs text-red-500">{errors.capacity.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Grade *</label>
          <select {...register("gradeId")} className={inputClass(!!errors.gradeId)}>
            <option value="">Select grade</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>Grade {g.level}</option>
            ))}
          </select>
          {errors.gradeId && <p className="text-xs text-red-500">{errors.gradeId.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Supervisor</label>
          <select {...register("supervisorId")} className={inputClass()}>
            <option value="">No supervisor</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name} {t.surname}</option>
            ))}
          </select>
        </div>
      </div>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold"
      >
        {isSubmitting ? "Saving..." : type === "create" ? "Create Class" : "Update Class"}
      </button>
    </form>
  );
};

export default ClassForm;