"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { createParent, updateParent } from "@/lib/actions/parent";

const schema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters!" })
    .max(20),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Surname is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().min(10, { message: "Phone must be at least 10 digits!" }),
  address: z.string().min(1, { message: "Address is required!" }),
});

type Inputs = z.infer<typeof schema>;

const ParentForm = ({
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
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    setServerError("");

    const payload = {
      username: formData.username.trim(),
      name: formData.name.trim(),
      surname: formData.surname.trim(),
      email: formData.email?.trim() || undefined,
      phone: formData.phone.trim(),
      address: formData.address.trim(),
    };

    console.log("PARENT PAYLOAD:", payload);

    const result =
      type === "create"
        ? await createParent(payload)
        : await updateParent(data.id, payload);

    console.log("PARENT DB RESPONSE:", result);

    if (!result.success) {
      setServerError(result.error || "Failed to save parent.");
      return;
    }

    router.refresh();
    onSuccess?.();
  });

  const inputClass = (hasError?: boolean) =>
    `w-full h-11 rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:ring-4 ${
      hasError
        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
        : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
    }`;

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          {type === "create" ? "Add new parent" : "Update parent"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Data saves to Neon DB via Prisma.
        </p>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Account
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Username *</label>
            <input
              type="text"
              placeholder="parent_user"
              {...register("username")}
              className={inputClass(!!errors.username)}
            />
            {errors.username && (
              <p className="text-xs text-red-500">{errors.username.message}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Personal details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">First name *</label>
            <input
              type="text"
              placeholder="John"
              {...register("name")}
              className={inputClass(!!errors.name)}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Surname *</label>
            <input
              type="text"
              placeholder="Doe"
              {...register("surname")}
              className={inputClass(!!errors.surname)}
            />
            {errors.surname && (
              <p className="text-xs text-red-500">{errors.surname.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              placeholder="parent@example.com"
              {...register("email")}
              className={inputClass(!!errors.email)}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Phone *</label>
            <input
              type="text"
              placeholder="03001234567"
              {...register("phone")}
              className={inputClass(!!errors.phone)}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Address *</label>
            <input
              type="text"
              placeholder="Street, City"
              {...register("address")}
              className={inputClass(!!errors.address)}
            />
            {errors.address && (
              <p className="text-xs text-red-500">{errors.address.message}</p>
            )}
          </div>
        </div>
      </div>

      {serverError && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-3.5 py-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm shadow-indigo-600/20 transition-all"
      >
        {isSubmitting
          ? type === "create"
            ? "Creating..."
            : "Updating..."
          : type === "create"
          ? "Create Parent"
          : "Update Parent"}
      </button>
    </form>
  );
};

export default ParentForm;