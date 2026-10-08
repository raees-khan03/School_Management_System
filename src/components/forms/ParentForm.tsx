"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { createParent, updateParent } from "@/lib/actions/parent";

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30),
  name: z.string().trim().min(1, "First name is required"),
  surname: z.string().trim().min(1, "Surname is required"),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{10,15}$/, "Enter a valid phone number (10-15 digits)"),
  address: z.string().trim().min(1, "Address is required"),
});

type Inputs = z.input<typeof schema>;

const inputClass = (err?: boolean) =>
  `h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
    err
      ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
      : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/15"
  }`;

type Props = {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
};

export default function ParentForm({ type, data, onSuccess }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
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
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    setServerError("");

    const payload = { ...formData };

    try {
      const result =
        type === "create"
          ? await createParent(payload as any)
          : await updateParent(data.id, payload as any);

      if (!result.success) {
        setServerError(result.error || "Failed to save parent.");
        return;
      }

      if (type === "create") reset();
      router.refresh();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setServerError("Something went wrong. Please try again.");
    }
  });

  const busy = isSubmitting;
  const nothingChanged = type === "update" && !isDirty;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {type === "create" ? "Add new parent" : "Update parent"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Fields marked with <span className="text-red-500">*</span> are required.
        </p>
      </div>

      <Section title="Account">
        <Field label="Username" required error={errors.username?.message} className="sm:col-span-2">
          <input
            {...register("username")}
            autoComplete="off"
            className={inputClass(!!errors.username)}
            placeholder="e.g. parent_smith"
          />
        </Field>
      </Section>

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
        <Field label="Phone number" required error={errors.phone?.message}>
          <input
            type="tel"
            {...register("phone")}
            className={inputClass(!!errors.phone)}
            placeholder="0300-1234567"
          />
        </Field>
        <Field label="Home Address" required error={errors.address?.message} className="sm:col-span-2">
          <input {...register("address")} className={inputClass(!!errors.address)} />
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

      <div className="border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={busy || nothingChanged}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Saving..." : type === "create" ? "Create parent" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

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