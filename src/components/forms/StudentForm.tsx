"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { createStudent, updateStudent } from "@/lib/actions/student";
import { getStudentFormData } from "@/lib/actions/shared";
import { useUploadThing } from "@/lib/uploadthing";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  name: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone min 10 digits").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  bloodType: z.string().min(1, "Blood type is required"),
  sex: z.enum(["MALE", "FEMALE"]),
  birthday: z.string().min(1, "Birthday is required"),
  parentId: z.string().min(1, "Parent is required"),
  classId: z.coerce.number().min(1, "Class is required"),
  gradeId: z.coerce.number().min(1, "Grade is required"),
  img: z.string().optional(),
});

type Inputs = z.input<typeof schema>;

type RelatedData = {
  parents: { id: string; name: string; surname: string }[];
  classes: { id: number; name: string }[];
  grades: { id: number; level: number }[];
};

const StudentForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}) => {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(data?.img || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [related, setRelated] = useState<RelatedData | null>(null);
  const [loadingRelated, setLoadingRelated] = useState(true);

  const { startUpload } = useUploadThing("teacherImage"); // same endpoint OK

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: data?.username || "",
      name: data?.name || "",
      surname: data?.surname || "",
      email: data?.email || "",
      phone: data?.phone || "",
      address: data?.address || "",
      bloodType: data?.bloodType || "",
      sex: data?.sex || "MALE",
      birthday: data?.birthday
        ? new Date(data.birthday).toISOString().split("T")[0]
        : "",
      parentId: data?.parentId || "",
      classId: data?.classId || undefined,
      gradeId: data?.gradeId || undefined,
      img: data?.img || "",
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getStudentFormData();
        setRelated(res);
      } catch (e) {
        console.error(e);
        setServerError("Failed to load parents/classes/grades.");
      } finally {
        setLoadingRelated(false);
      }
    })();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setServerError("Image must be under 2MB");
      return;
    }
    setServerError("");
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onSubmit = handleSubmit(async (formData) => {
    setServerError("");
    let imageUrl = data?.img || "";

    if (selectedFile) {
      setUploading(true);
      try {
        const uploadRes = await startUpload([selectedFile]);
        if (uploadRes?.[0]) {
          imageUrl =
            (uploadRes[0] as any).ufsUrl || (uploadRes[0] as any).url || "";
        }
      } catch (err) {
        console.error(err);
        setServerError("Failed to upload image.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const payload = {
      username: formData.username.trim(),
      name: formData.name.trim(),
      surname: formData.surname.trim(),
      email: formData.email?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      address: formData.address.trim(),
      img: imageUrl || undefined,
      bloodType: formData.bloodType.trim(),
      sex: formData.sex,
      birthday: formData.birthday,
      parentId: formData.parentId,
      classId: Number(formData.classId),
      gradeId: Number(formData.gradeId),
    };

    console.log("STUDENT PAYLOAD:", payload);

    const result =
      type === "create"
        ? await createStudent(payload)
        : await updateStudent(data.id, payload);

    console.log("STUDENT DB RESPONSE:", result);

    if (!result.success) {
      setServerError(result.error || "Failed to save student.");
      return;
    }

    router.refresh();
    onSuccess?.();
  });

  const inputClass = (hasError?: boolean) =>
    `w-full h-11 rounded-xl border bg-white px-3.5 text-sm outline-none transition-all focus:ring-4 ${
      hasError
        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
        : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
    }`;

  if (loadingRelated) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        Loading form options...
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {type === "create" ? "Add new student" : "Update student"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Required fields marked *. Saves to Neon DB.
        </p>
      </div>

      {/* Photo */}
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-slate-100 border shrink-0">
          {preview ? (
            <Image
              src={preview}
              alt="Student"
              fill
              className="object-cover"
              unoptimized={preview.startsWith("blob:")}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">
              No Image
            </div>
          )}
        </div>
        <label className="cursor-pointer rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
          {preview ? "Change Photo" : "Upload Photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>
      </div>

      {/* Account */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Username *</label>
          <input {...register("username")} className={inputClass(!!errors.username)} />
          {errors.username && (
            <p className="text-xs text-red-500">{errors.username.message}</p>
          )}
        </div>
      </div>

      {/* Personal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">First Name *</label>
          <input {...register("name")} className={inputClass(!!errors.name)} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Surname *</label>
          <input {...register("surname")} className={inputClass(!!errors.surname)} />
          {errors.surname && (
            <p className="text-xs text-red-500">{errors.surname.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input {...register("email")} className={inputClass(!!errors.email)} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <input {...register("phone")} className={inputClass(!!errors.phone)} />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Address *</label>
          <input {...register("address")} className={inputClass(!!errors.address)} />
          {errors.address && (
            <p className="text-xs text-red-500">{errors.address.message}</p>
          )}
        </div>
      </div>

      {/* Extra */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Blood Type *</label>
          <input {...register("bloodType")} className={inputClass(!!errors.bloodType)} />
          {errors.bloodType && (
            <p className="text-xs text-red-500">{errors.bloodType.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Sex *</label>
          <select {...register("sex")} className={inputClass(!!errors.sex)}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Birthday *</label>
          <input type="date" {...register("birthday")} className={inputClass(!!errors.birthday)} />
          {errors.birthday && (
            <p className="text-xs text-red-500">{errors.birthday.message}</p>
          )}
        </div>
      </div>

      {/* School links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Parent *</label>
          <select {...register("parentId")} className={inputClass(!!errors.parentId)}>
            <option value="">Select parent</option>
            {related?.parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.surname}
              </option>
            ))}
          </select>
          {errors.parentId && (
            <p className="text-xs text-red-500">{errors.parentId.message}</p>
          )}
          {related && related.parents.length === 0 && (
            <p className="text-xs text-amber-600">Create a parent first.</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Grade *</label>
          <select {...register("gradeId")} className={inputClass(!!errors.gradeId)}>
            <option value="">Select grade</option>
            {related?.grades.map((g) => (
              <option key={g.id} value={g.id}>
                Grade {g.level}
              </option>
            ))}
          </select>
          {errors.gradeId && (
            <p className="text-xs text-red-500">{errors.gradeId.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Class *</label>
          <select {...register("classId")} className={inputClass(!!errors.classId)}>
            <option value="">Select class</option>
            {related?.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.classId && (
            <p className="text-xs text-red-500">{errors.classId.message}</p>
          )}
        </div>
      </div>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || uploading}
        className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold"
      >
        {uploading
          ? "Uploading image..."
          : isSubmitting
          ? "Saving..."
          : type === "create"
          ? "Create Student"
          : "Update Student"}
      </button>
    </form>
  );
};

export default StudentForm;