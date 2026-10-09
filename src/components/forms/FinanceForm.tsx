"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { createTransaction, updateTransaction, type FinanceData } from "@/lib/actions/finance";

// --- Validation Schema (No z.coerce, Clean Enum) ---
const schema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Amount must be greater than 0"),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().trim().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
});

type Inputs = z.input<typeof schema>;

// --- Helper Functions ---
const toDateInput = (d?: Date | string | null) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const inputClass = (err?: boolean) =>
  `h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    err
      ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
      : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/15"
  }`;

type Props = {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
};

export default function FinanceForm({ type, data, onSuccess }: Props) {
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
      title: data?.title || "",
      amount: data?.amount ? String(data.amount) : "",
      type: data?.type || "INCOME",
      category: data?.category || "",
      date: toDateInput(data?.date) || toDateInput(new Date()),
      description: data?.description || "",
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    setServerError("");

    const payload: FinanceData = {
      title: formData.title.trim(),
      amount: Number(formData.amount),
      type: formData.type as "INCOME" | "EXPENSE",
      category: formData.category.trim(),
      date: formData.date,
      description: formData.description?.trim() || undefined,
    };

    try {
      const result =
        type === "create"
          ? await createTransaction(payload)
          : await updateTransaction(Number(data.id), payload);

      if (!result.success) {
        setServerError(result.error || "Failed to save transaction.");
        return;
      }
      
      if (type === "create") reset();
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setServerError("Something went wrong while processing the transaction.");
    }
  });

  const busy = isSubmitting;
  const nothingChanged = type === "update" && !isDirty;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {type === "create" ? "Add Transaction" : "Update Transaction"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Record an income or expense in the financial ledger.
        </p>
      </div>

      {/* FORM FIELDS */}
      <Section title="Transaction Details">
        <Field label="Transaction Title" required error={errors.title?.message} className="sm:col-span-2">
          <input 
            {...register("title")} 
            placeholder="e.g. November Tuition Fees" 
            className={inputClass(!!errors.title)} 
          />
        </Field>

        <Field label="Amount ($)" required error={errors.amount?.message}>
          <input 
            type="number" 
            step="0.01" 
            {...register("amount")} 
            placeholder="500.00" 
            className={`${inputClass(!!errors.amount)} tabular-nums`} 
          />
        </Field>

        <Field label="Type" required error={errors.type?.message}>
          <select {...register("type")} className={inputClass(!!errors.type)}>
            <option value="INCOME">Income (Revenue)</option>
            <option value="EXPENSE">Expense (Cost)</option>
          </select>
        </Field>

        <Field label="Category" required error={errors.category?.message}>
          <input 
            {...register("category")} 
            placeholder="e.g. Fees, Salary, Utilities" 
            className={inputClass(!!errors.category)} 
          />
        </Field>

        <Field label="Date" required error={errors.date?.message}>
          <input 
            type="date" 
            {...register("date")} 
            className={inputClass(!!errors.date)} 
          />
        </Field>

        <Field label="Description" className="sm:col-span-2">
          <textarea
            rows={3}
            {...register("description")}
            placeholder="Add optional notes or reference numbers..."
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
          />
        </Field>
      </Section>

      {/* ERROR BANNER */}
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      {/* ACTION BUTTON */}
      <div className="border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={busy || nothingChanged}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Processing..." : type === "create" ? "Add Transaction" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// --- Layout Helpers ---
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