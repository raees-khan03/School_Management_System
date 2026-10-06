"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  createSubject,
  updateSubject,
  getSubjectFormData,
} from "@/lib/actions/subject";

const schema = z.object({
  name: z.string().min(1, { message: "Subject name is required!" }),
  teacherIds: z.array(z.string()).optional(),
});

type Inputs = z.infer<typeof schema>;

const SubjectForm = ({
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
  const [teachers, setTeachers] = useState<
    { id: string; name: string; surname: string }[]
  >([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>(
    data?.teachers?.map((t: any) => t.id) || []
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset, // ✅ React Hook Form ka reset function
    formState: { errors, isSubmitting },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data?.name || "",
      teacherIds: data?.teachers?.map((t: any) => t.id) || [],
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getSubjectFormData();
        setTeachers(res.teachers);
      } catch (e) {
        console.error(e);
        setServerError("Failed to load teachers.");
      } finally {
        setLoadingTeachers(false);
      }
    })();
  }, []);

  useEffect(() => {
    setValue("teacherIds", selectedTeachers);
  }, [selectedTeachers, setValue]);

  const toggleTeacher = (id: string) => {
    setSelectedTeachers((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const onSubmit = handleSubmit(async (formData) => {
    setServerError("");

    const payload = {
      name: formData.name.trim(),
      teacherIds: selectedTeachers,
    };

    const result =
      type === "create"
        ? await createSubject(payload)
        : await updateSubject(Number(data.id), payload);

    if (!result.success) {
      setServerError(result.error || "Failed to save subject.");
      return;
    }

    // ✅ 1. Form Inputs Clean (Reset) Karein
    reset();
    setSelectedTeachers([]);
    setServerError("");

    // ✅ 2. Page Refresh Karein & Modal Band (Close) Karein
    router.refresh();
    onSuccess?.(); // Yeh FormModal ke "setOpen(false)" ko trigger karta hai
  });

  const inputClass = (hasError?: boolean) =>
    `w-full h-11 rounded-xl border bg-white px-3.5 text-sm outline-none transition-all focus:ring-4 ${
      hasError
        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
        : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
    }`;

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {type === "create" ? "Add new subject" : "Update subject"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Assign teachers who teach this subject.
        </p>
      </div>

      {/* Subject name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Subject name *</label>
        <input
          type="text"
          placeholder="e.g. Mathematics"
          {...register("name")}
          className={inputClass(!!errors.name)}
        />
        {errors.name && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Teachers multi-select */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Teachers {selectedTeachers.length > 0 && `(${selectedTeachers.length} selected)`}
        </label>

        {loadingTeachers ? (
          <p className="text-sm text-slate-400">Loading teachers...</p>
        ) : teachers.length === 0 ? (
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            No teachers found. Create teachers first.
          </p>
        ) : (
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {teachers.map((t) => {
              const checked = selectedTeachers.includes(t.id);
              return (
                <label
                  key={t.id}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer text-sm transition-colors ${
                    checked
                      ? "bg-indigo-50 text-indigo-800 border border-indigo-200"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTeacher(t.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    {t.name} {t.surname}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {serverError && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-3.5 py-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-all"
      >
        {isSubmitting
          ? type === "create"
            ? "Creating..."
            : "Updating..."
          : type === "create"
          ? "Create Subject"
          : "Update Subject"}
      </button>
    </form>
  );
};

export default SubjectForm;