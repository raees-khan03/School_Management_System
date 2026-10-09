"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Printer,
  Search,
  Check,
  ChevronsUpDown,
  X,
  User,
} from "lucide-react";
import { collectFee } from "@/lib/actions/fee";

const schema = z.object({
  studentId: z.string().min(1, "Please select a student"),
  month: z.string().min(1, "Month is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  paymentMethod: z.enum(["Cash", "Bank Transfer", "Credit Card"]),
});

type Inputs = z.infer<typeof schema>;

type StudentOpt = {
  id: string;
  name: string;
  surname: string;
  username: string;
  class: { name: string } | null;
};

export default function FeeClient({ students }: { students: StudentOpt[] }) {
  const [serverError, setServerError] = useState("");
  const [receiptNo, setReceiptNo] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentId: "",
      amount: "" as unknown as number,
      month: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
      paymentMethod: "Cash",
    },
  });

  const watchStudentId = watch("studentId");
  const watchAmount = watch("amount");
  const watchMonth = watch("month");
  const watchMethod = watch("paymentMethod");

  const selectedStudent = students.find((s) => s.id === watchStudentId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students.slice(0, 50);
    const query = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.surname.toLowerCase().includes(query) ||
        s.username.toLowerCase().includes(query) ||
        (s.class?.name && s.class.name.toLowerCase().includes(query))
    );
  }, [students, searchQuery]);

  const handleSelectStudent = (student: StudentOpt) => {
    setValue("studentId", student.id, { shouldValidate: true });
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  const handleClearStudent = () => {
    setValue("studentId", "", { shouldValidate: true });
    setSearchQuery("");
  };

  const onSubmit = handleSubmit(async (formData) => {
    setServerError("");
    setReceiptNo(null);

    const targetStudent = students.find((s) => s.id === formData.studentId);
    if (!targetStudent) return;

    const payload = {
      studentId: formData.studentId,
      studentName: `${targetStudent.name} ${targetStudent.surname}`,
      className: targetStudent.class?.name || "N/A",
      amount: formData.amount,
      month: formData.month,
      paymentMethod: formData.paymentMethod,
    };

    const res = await collectFee(payload);
    if (!res.success) {
      setServerError(res.error || "Failed to process payment.");
      return;
    }

    setReceiptNo(res.transactionId!);
  });

  const handlePrint = () => {
    window.print();
  };

  const handleNewPayment = () => {
    reset();
    handleClearStudent();
    setReceiptNo(null);
  };

  const inputClass = (err?: boolean) =>
    `h-10 w-full rounded-lg border bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-4 ${
      err
        ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
        : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/15"
    }`;

  return (
    <div className="flex flex-col gap-6 lg:flex-row items-start">
      <style>{`
        @media print {
          @page { size: A5 portrait; margin: 10mm; }
          body * { visibility: hidden !important; }
          #print-receipt, #print-receipt * { visibility: visible !important; }
          #print-receipt { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; border: none !important; box-shadow: none !important; }
        }
      `}</style>

      {/* ================= LEFT: FORM ================= */}
      <div className="w-full lg:w-1/2 xl:w-2/5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:hidden">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Fee Collection
        </h2>
        <p className="mt-1 text-sm text-slate-500 mb-6">
          Record student payments and generate slips.
        </p>

        {receiptNo ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in-95">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Payment Successful</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              Transaction ID: #{receiptNo} has been saved to the ledger.
            </p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus-visible:ring-4 focus-visible:ring-teal-500/30"
              >
                <Printer className="h-4 w-4" /> Print Receipt
              </button>
              <button
                type="button"
                onClick={handleNewPayment}
                className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                New Payment
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="relative" ref={dropdownRef}>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Student <span className="text-red-500">*</span>
              </span>

              {selectedStudent ? (
                <div className="flex items-center justify-between h-11 rounded-lg border border-teal-500/40 bg-teal-50/50 px-3.5 py-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {selectedStudent.name} {selectedStudent.surname}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Class: {selectedStudent.class?.name || "N/A"} • ID: {selectedStudent.username}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearStudent}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    placeholder="Search student by name, ID or class..."
                    className={`${inputClass(!!errors.studentId)} pl-9 pr-8`}
                  />
                  <ChevronsUpDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              )}

              <input type="hidden" {...register("studentId")} />
              {errors.studentId && (
                <p className="mt-1 text-xs text-red-600">{errors.studentId.message}</p>
              )}

              {isDropdownOpen && !selectedStudent && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectStudent(s)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-teal-50/60"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {s.name} {s.surname}
                          </p>
                          <p className="text-xs text-slate-500">
                            Class: {s.class?.name || "N/A"} • ID: {s.username}
                          </p>
                        </div>
                        {watchStudentId === s.id && (
                          <Check className="h-4 w-4 text-teal-600 shrink-0" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No student found matching &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                {/* 1. Updated Label to (Rs) */}
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Amount (Rs) *</span>
                <input type="number" step="0.01" {...register("amount")} placeholder="e.g. 5000" className={inputClass(!!errors.amount)} />
                {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Payment Method</span>
                <select {...register("paymentMethod")} className={inputClass()}>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Fee Month / Title *</span>
              <input type="text" {...register("month")} placeholder="e.g. October 2026" className={inputClass(!!errors.month)} />
              {errors.month && <p className="mt-1 text-xs text-red-600">{errors.month.message}</p>}
            </label>

            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Collect Fee
            </button>
          </form>
        )}
      </div>

      {/* ================= RIGHT: LIVE RECEIPT ================= */}
      <div className="w-full lg:w-1/2 xl:w-3/5 flex justify-center pb-8 print:w-full print:pb-0">
        <div
          id="print-receipt"
          className="w-full max-w-md bg-white border border-slate-200 shadow-lg p-8 relative overflow-hidden"
          style={{ backgroundImage: "radial-gradient(#f1f5f9 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        >
          <div className="flex items-center justify-center gap-3 mb-6 border-b-2 border-slate-800 pb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">CampusPulse</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Official Fee Receipt</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Receipt No.</p>
                <p className="text-sm font-bold text-slate-900 font-mono">
                  {receiptNo ? `#${String(receiptNo).padStart(6, '0')}` : "DRAFT"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Date</p>
                <p className="text-sm font-bold text-slate-900 tabular-nums">
                  {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date())}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex justify-between border-b border-slate-200 pb-3">
                <span className="text-xs text-slate-500 font-medium">Student Name</span>
                <span className="text-sm font-bold text-slate-900 text-right">
                  {selectedStudent ? `${selectedStudent.name} ${selectedStudent.surname}` : "—"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-3">
                <span className="text-xs text-slate-500 font-medium">Class & ID</span>
                <span className="text-sm font-semibold text-slate-700 text-right">
                  {selectedStudent?.class?.name || "—"} <span className="text-slate-300 mx-1">|</span> {selectedStudent?.username || "—"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-3">
                <span className="text-xs text-slate-500 font-medium">Fee Title / Month</span>
                <span className="text-sm font-semibold text-slate-700 text-right">
                  {watchMonth || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500 font-medium">Payment Method</span>
                <span className="text-sm font-semibold text-slate-700 text-right">
                  {watchMethod || "—"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl">
              <span className="text-sm font-semibold uppercase tracking-wider">Total Paid</span>
              {/* 2. Updated Receipt Total formatting to Rs */}
              <span className="text-2xl font-black tabular-nums">
                Rs {Number(watchAmount || 0).toLocaleString("en-PK")}
              </span>
            </div>

            <div className="pt-10 flex justify-between items-end border-t border-dashed border-slate-300">
              <div className="text-center">
                <div className="w-32 border-b border-slate-800 mb-2"></div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cashier Sign</p>
              </div>
              {receiptNo ? (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Pending
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}