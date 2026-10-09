"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  Trash2,
  UploadCloud,
  User,
} from "lucide-react";
import { createStudent, updateStudent } from "@/lib/actions/student";
import { getStudentFormData } from "@/lib/actions/shared";
import { useUploadThing } from "@/lib/uploadthing";

/* ---------------- Schema ----------------
   z.coerce nahi use kiya: select ki values string rehti hain aur submit par
   Number() hota hai, taake z.input aur z.infer same type dein.
*/
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const MAX_IMAGE_MB = 2;
const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp"];
const MIN_PASSWORD = 16;
const MAX_PASSWORD = 72; // Clerk ki upper limit

const baseSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, - or _"),
  name: z.string().trim().min(1, "First name is required"),
  surname: z.string().trim().min(1, "Surname is required"),
  email: z.string().trim().email("Enter a valid email").or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{10,15}$/, "Enter a valid phone number (10-15 digits)")
    .or(z.literal("")),
  address: z.string().trim().min(1, "Address is required"),
  bloodType: z.string().min(1, "Select a blood type"),
  sex: z.enum(["MALE", "FEMALE"]),
  birthday: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => !isNaN(Date.parse(v)), "Enter a valid date")
    .refine((v) => new Date(v) <= new Date(), "Date of birth cannot be in the future"),
  parentId: z.string().min(1, "Select a parent"),
  classId: z.string().min(1, "Select a class"),
  gradeId: z.string().min(1, "Select a grade"),
  password: z.string(),
  confirmPassword: z.string(),
});

// create mein password zaroori, update mein optional (khali = purana rahega)
const makeSchema = (type: "create" | "update") =>
  baseSchema.superRefine((v, ctx) => {
    if (type === "create" && !v.password) {
      ctx.addIssue({ code: "custom", path: ["password"], message: "Password is required" });
    }
    if (v.password && v.password.length < MIN_PASSWORD) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: `Password must be at least ${MIN_PASSWORD} characters`,
      });
    }
    if (v.password.length > MAX_PASSWORD) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: `Maximum ${MAX_PASSWORD} characters`,
      });
    }
    if (v.password && v.password !== v.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

type Inputs = z.input<typeof baseSchema>;

const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
  const bytes = crypto.getRandomValues(new Uint32Array(MIN_PASSWORD));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

/* ---------------- Styles ---------------- */
const inputClass = (err?: boolean) =>
  `h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
    err
      ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
      : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/15"
  }`;

const toDateInput = (value?: string | Date | null) => {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
};

type Props = {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
};

export default function StudentForm({ type, data, onSuccess }: Props) {
  const router = useRouter();

  // Photo
  const [preview, setPreview] = useState<string | null>(data?.img || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removedImage, setRemovedImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const blobRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Related options (parents, grades, classes)
  const [related, setRelated] = useState<any>(null);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [relatedError, setRelatedError] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const { startUpload } = useUploadThing("teacherImage");

  const schema = useMemo(() => makeSchema(type), [type]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
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
      birthday: toDateInput(data?.birthday),
      parentId: data?.parentId || "",
      classId: data?.classId ? String(data.classId) : "",
      gradeId: data?.gradeId ? String(data.gradeId) : "",
      password: "",
      confirmPassword: "",
    },
  });

  const loadRelated = useCallback(async () => {
    setLoadingRelated(true);
    setRelatedError(false);
    try {
      setRelated(await getStudentFormData());
    } catch {
      setRelatedError(true);
    } finally {
      setLoadingRelated(false);
    }
  }, []);

  useEffect(() => {
    loadRelated();
  }, [loadRelated]);

  // blob URL memory leak se bachao
  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);

  const handleGenerate = () => {
    const pw = generatePassword();
    setValue("password", pw, { shouldDirty: true, shouldValidate: true });
    setValue("confirmPassword", pw, { shouldDirty: true, shouldValidate: true });
    setShowPassword(true); // taake admin dekh kar student ko bata sake
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGES.includes(file.type)) {
      setServerError("Only JPG, PNG or WEBP images are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setServerError(`Image must be under ${MAX_IMAGE_MB}MB.`);
      e.target.value = "";
      return;
    }

    setServerError("");
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    blobRef.current = URL.createObjectURL(file);
    setSelectedFile(file);
    setRemovedImage(false);
    setPreview(blobRef.current);
  };

  const handleRemoveImage = () => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSelectedFile(null);
    setPreview(null);
    setRemovedImage(true);
  };

  const onSubmit = handleSubmit(async (formData) => {
    setServerError("");

    let imageUrl = removedImage ? "" : data?.img || "";

    if (selectedFile) {
      setUploading(true);
      try {
        const uploadRes = await startUpload([selectedFile]);
        if (!uploadRes?.[0]) throw new Error("Upload failed");
        imageUrl = (uploadRes[0] as any).ufsUrl || (uploadRes[0] as any).url;
      } catch {
        setUploading(false);
        setServerError("Failed to upload image. Please try again.");
        return;
      }
      setUploading(false);
    }

    const { confirmPassword, password, ...rest } = formData;
    const payload = {
      ...rest,
      classId: Number(rest.classId),
      gradeId: Number(rest.gradeId),
      password: password || undefined,
      img: imageUrl || undefined,
    };

    try {
      const result =
        type === "create"
          ? await createStudent(payload as any)
          : await updateStudent(data.id, payload as any);

      if (!result.success) {
        setServerError(result.error || "Failed to save student.");
        return;
      }

      if (type === "create") reset();
      else {
        setValue("password", "");
        setValue("confirmPassword", "");
      }
      router.refresh();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setServerError("Something went wrong. Please try again.");
    }
  });

  /* ---------------- Loading / error states ---------------- */
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
        <p className="text-sm text-slate-600">Could not load parents, grades and classes.</p>
        <button
          type="button"
          onClick={loadRelated}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  const busy = isSubmitting || uploading;
  const nothingChanged = type === "update" && !isDirty && !selectedFile && !removedImage;
  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {type === "create" ? "Add new student" : "Update student"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Fields marked with <span className="text-red-500">*</span> are required.
        </p>
      </div>

      {/* Photo */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
          {preview ? (
            <Image src={preview} alt="Student photo" fill sizes="64px" className="object-cover" unoptimized />
          ) : (
            <User className="h-6 w-6 text-slate-400" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-within:ring-4 focus-within:ring-teal-500/20">
              <UploadCloud className="h-4 w-4 text-slate-500" />
              {preview ? "Change photo" : "Upload photo"}
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGES.join(",")}
                className="sr-only"
                onChange={handleImageChange}
              />
            </label>
            {preview && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">JPG, PNG or WEBP, up to {MAX_IMAGE_MB}MB.</p>
        </div>
      </div>

      {/* Account */}
      <Section title="Account">
        <Field label="Username" required error={errors.username?.message} className="sm:col-span-2">
          <input
            {...register("username")}
            autoComplete="off"
            className={inputClass(!!errors.username)}
            placeholder="e.g. ali_khan"
          />
        </Field>

        <Field
          label={type === "create" ? "Password" : "New password (optional)"}
          required={type === "create"}
          error={errors.password?.message}
        >
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...register("password")}
              className={`${inputClass(!!errors.password)} pr-10`}
              placeholder={type === "update" ? "Leave blank to keep current" : `Min ${MIN_PASSWORD} characters`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            {...register("confirmPassword")}
            className={inputClass(!!errors.confirmPassword)}
          />
        </Field>

        <button
          type="button"
          onClick={handleGenerate}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline sm:col-span-2"
        >
          <KeyRound className="h-4 w-4" />
          Generate strong password
        </button>
      </Section>

      {/* Personal */}
      <Section title="Personal info">
        <Field label="First name" required error={errors.name?.message}>
          <input {...register("name")} className={inputClass(!!errors.name)} />
        </Field>
        <Field label="Surname" required error={errors.surname?.message}>
          <input {...register("surname")} className={inputClass(!!errors.surname)} />
        </Field>
        <Field label="Email address" error={errors.email?.message}>
          <input type="email" {...register("email")} className={inputClass(!!errors.email)} />
        </Field>
        <Field label="Phone number" error={errors.phone?.message}>
          <input
            type="tel"
            {...register("phone")}
            className={inputClass(!!errors.phone)}
            placeholder="0300-1234567"
          />
        </Field>
        <Field label="Address" required error={errors.address?.message} className="sm:col-span-2">
          <input {...register("address")} className={inputClass(!!errors.address)} />
        </Field>
        <Field label="Date of birth" required error={errors.birthday?.message}>
          <input type="date" max={today} {...register("birthday")} className={inputClass(!!errors.birthday)} />
        </Field>
        <Field label="Blood type" required error={errors.bloodType?.message}>
          <select {...register("bloodType")} className={inputClass(!!errors.bloodType)}>
            <option value="">Select blood type</option>
            {BLOOD_TYPES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>

        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium text-slate-700">
            Gender <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {(["MALE", "FEMALE"] as const).map((v) => (
              <label key={v} className="cursor-pointer">
                <input type="radio" value={v} {...register("sex")} className="peer sr-only" />
                <span className="flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 transition peer-checked:border-teal-500 peer-checked:bg-teal-50 peer-checked:text-teal-700 peer-focus-visible:ring-4 peer-focus-visible:ring-teal-500/20">
                  {v === "MALE" ? "Male" : "Female"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </Section>

      {/* Academic */}
      <Section title="Academic details">
        <Field label="Parent" required error={errors.parentId?.message} className="sm:col-span-2">
          <select {...register("parentId")} className={inputClass(!!errors.parentId)}>
            <option value="">Select parent</option>
            {related?.parents?.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.surname}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Grade" required error={errors.gradeId?.message}>
          <select {...register("gradeId")} className={inputClass(!!errors.gradeId)}>
            <option value="">Select grade</option>
            {related?.grades?.map((g: any) => (
              <option key={g.id} value={String(g.id)}>
                Grade {g.level}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Class" required error={errors.classId?.message}>
          <select {...register("classId")} className={inputClass(!!errors.classId)}>
            <option value="">Select class</option>
            {related?.classes?.map((c: any) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
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

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={busy || nothingChanged}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {uploading ? "Uploading photo..." : isSubmitting ? "Saving..." : type === "create" ? "Create student" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

/* ---------------- Helpers ---------------- */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-slate-100 pt-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</h3>
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