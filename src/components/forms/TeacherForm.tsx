"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing";
import { createTeacher, updateTeacher } from "@/lib/actions/teacher";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 chars"),
  name: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone min 10 digits").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  bloodType: z.string().min(1, "Blood type is required"),
  sex: z.enum(["MALE", "FEMALE"]),
  birthday: z.string().min(1, "Birthday is required"),
  img: z.string().optional(),
});

type Inputs = z.infer<typeof schema>;

const TeacherForm = ({
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

  const { startUpload } = useUploadThing("teacherImage");

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
      img: data?.img || "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setServerError("Image size must be less than 2MB");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const onSubmit = handleSubmit(async (formData) => {
    setServerError("");
    let imageUrl = data?.img || "";

    if (selectedFile) {
      setUploading(true);
      try {
        const uploadRes = await startUpload([selectedFile]);
        if (uploadRes && uploadRes[0]) {
          imageUrl = (uploadRes[0] as any).ufsUrl || (uploadRes[0] as any).url;
        }
      } catch (err) {
        console.error("UPLOAD ERROR:", err);
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
    };

    const result =
      type === "create"
        ? await createTeacher(payload)
        : await updateTeacher(data.id, payload);

    if (!result.success) {
      setServerError(result.error || "Failed to save teacher.");
      return;
    }

    router.refresh();
    onSuccess?.();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Add New Teacher" : "Update Teacher"}
      </h1>

      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-slate-100 border shrink-0">
          {preview ? (
            <Image src={preview} alt="Avatar" fill className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Username *</label>
          <input
            {...register("username")}
            className="w-full p-2.5 border rounded-xl text-sm"
          />
          {errors.username && (
            <p className="text-xs text-red-500">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">First Name *</label>
          <input
            {...register("name")}
            className="w-full p-2.5 border rounded-xl text-sm"
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Surname *</label>
          <input
            {...register("surname")}
            className="w-full p-2.5 border rounded-xl text-sm"
          />
          {errors.surname && (
            <p className="text-xs text-red-500">{errors.surname.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            {...register("email")}
            className="w-full p-2.5 border rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Phone</label>
          <input
            {...register("phone")}
            className="w-full p-2.5 border rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Address *</label>
          <input
            {...register("address")}
            className="w-full p-2.5 border rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Blood Type *</label>
          <input
            {...register("bloodType")}
            className="w-full p-2.5 border rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Sex *</label>
          <select
            {...register("sex")}
            className="w-full p-2.5 border rounded-xl text-sm"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Birthday *</label>
          <input
            type="date"
            {...register("birthday")}
            className="w-full p-2.5 border rounded-xl text-sm"
          />
        </div>
      </div>

      {serverError && (
        <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || uploading}
        className="h-11 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {uploading
          ? "Uploading image..."
          : isSubmitting
          ? "Saving..."
          : type === "create"
          ? "Create Teacher"
          : "Update Teacher"}
      </button>
    </form>
  );
};

export default TeacherForm;