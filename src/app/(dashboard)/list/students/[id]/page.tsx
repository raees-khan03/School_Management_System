import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Droplet,
  Calendar,
  Mail,
  Phone,
  CheckCircle2,
  BookOpen,
  MonitorPlay,
  Award,
  Receipt,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";

import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import FormModal from "@/components/FormModal";
import BigCalendar from "@/components/BigCalender";
import Announcements from "@/components/Announcements";
import Performance from "@/components/Performance";

const formatCurrency = (amount: number) => {
  return `Rs ${amount.toLocaleString("en-PK")}`;
};

const formatDate = (dateInput: Date | string) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
};

export default async function SingleStudentPage({
  params,
}: {
  params: { id: string };
}) {
  const { role, userId } = await getAuthUser();

  // 1. Fetch Student details
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      class: {
        include: {
          lessons: {
            include: { subject: true, teacher: true },
          },
          _count: {
            select: { lessons: true },
          },
        },
      },
      grade: true,
    },
  });

  if (!student) {
    return notFound();
  }

  // Security check: Admin, Teachers, Student themselves, or their Parent
  if (role === "student" && userId !== student.id) redirect("/");
  if (role === "parent" && userId !== student.parentId) redirect("/");

  // 2. Fetch Fee Transactions for this student from Neon DB
  const studentFullName = `${student.name} ${student.surname}`;
  const feeTransactions = await prisma.transaction.findMany({
    where: {
      category: "Fee",
      OR: [
        { title: { contains: studentFullName, mode: "insensitive" } },
        { description: { contains: studentFullName, mode: "insensitive" } },
        { description: { contains: student.username, mode: "insensitive" } },
      ],
    },
    orderBy: { date: "desc" },
  });

  // Calculate total fee paid
  const totalFeePaid = feeTransactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 xl:flex-row bg-slate-50 min-h-screen">
      {/* LEFT SIDE */}
      <div className="w-full xl:w-2/3 flex flex-col gap-6">
        
        {/* TOP CARDS */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* USER INFO CARD */}
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex gap-6">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-md bg-slate-50 sm:h-32 sm:w-32">
              <Image
                src={student.img || "/noAvatar.png"}
                alt={`${student.name} ${student.surname}`}
                fill
                sizes="128px"
                className="object-cover"
                unoptimized
              />
            </div>
            
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <h1 className="text-xl font-bold text-slate-900 truncate">
                    {student.name} {student.surname}
                  </h1>
                  {role === "admin" && (
                    <FormModal
                      table="student"
                      type="update"
                      data={JSON.parse(JSON.stringify(student))}
                      id={student.id}
                    />
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500 line-clamp-1 font-medium">
                  Grade {student.grade?.level || "-"} <span className="mx-1.5">•</span> Class {student.class?.name || "-"}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-teal-600 shrink-0" />
                  <span className="truncate">{student.bloodType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-600 shrink-0" />
                  <span className="truncate tabular-nums">
                    {formatDate(student.birthday)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-teal-600 shrink-0" />
                  <span className="truncate">{student.email || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-teal-600 shrink-0" />
                  <span className="truncate tabular-nums">{student.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="flex flex-1 flex-wrap gap-4">
            <div className="flex w-full min-w-[130px] flex-1 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:w-auto">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold tabular-nums text-slate-900">90%</h2>
                <p className="truncate text-xs font-medium text-slate-500">Attendance</p>
              </div>
            </div>

            <div className="flex w-full min-w-[130px] flex-1 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:w-auto">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <Receipt className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold tabular-nums text-slate-900">
                  {formatCurrency(totalFeePaid)}
                </h2>
                <p className="truncate text-xs font-medium text-slate-500">Total Fee Paid</p>
              </div>
            </div>

            <div className="flex w-full min-w-[130px] flex-1 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:w-auto">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <MonitorPlay className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold tabular-nums text-slate-900">{student.class?._count.lessons || 0}</h2>
                <p className="truncate text-xs font-medium text-slate-500">Lessons</p>
              </div>
            </div>

            <div className="flex w-full min-w-[130px] flex-1 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:w-auto">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold tabular-nums text-slate-900">{student.class?.name || "-"}</h2>
                <p className="truncate text-xs font-medium text-slate-500">Class Section</p>
              </div>
            </div>
          </div>
        </div>

        {/* FEE PAYMENT HISTORY CARD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Fee Payment History</h2>
                <p className="text-xs text-slate-500">Records of all fee receipts collected for this student.</p>
              </div>
            </div>
            {role === "admin" && (
              <Link
                href="/fees"
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                + Collect Fee
              </Link>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {feeTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{tx.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{tx.description || "Fee Payment"}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600 tabular-nums">
                    +{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 tabular-nums">
                    {formatDate(tx.date)}
                  </p>
                </div>
              </div>
            ))}

            {feeTransactions.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-sm">
                No fee payment records found for this student yet.
              </div>
            )}
          </div>
        </div>

        {/* SCHEDULE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-[800px] flex flex-col">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Student&apos;s Schedule</h2>
          <div className="flex-1 min-h-0">
            <BigCalendar lessons={JSON.parse(JSON.stringify(student.class?.lessons || []))} />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full xl:w-1/3 flex flex-col gap-6">
        
        {/* SHORTCUTS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div className="flex flex-col gap-2.5 text-sm font-medium">
            <Link
              href={`/list/students/${student.id}/report`}
              className="flex items-center justify-between gap-2 p-3 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm"
            >
              <span>Generate Report Card</span>
              <span>→</span>
            </Link>

            <Link
              className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              href={`/list/lessons?classId=${student.classId}`}
            >
              <span>Student&apos;s Lessons</span>
              <span className="text-slate-400">→</span>
            </Link>

            <Link
              className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              href={`/list/teachers?classId=${student.classId}`}
            >
              <span>Student&apos;s Teachers</span>
              <span className="text-slate-400">→</span>
            </Link>

            <Link
              className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              href={`/list/exams?classId=${student.classId}`}
            >
              <span>Student&apos;s Exams</span>
              <span className="text-slate-400">→</span>
            </Link>

            <Link
              className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              href={`/list/assignments?classId=${student.classId}`}
            >
              <span>Student&apos;s Assignments</span>
              <span className="text-slate-400">→</span>
            </Link>

            <Link
              className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              href={`/list/results?studentId=${student.id}`}
            >
              <span>Student&apos;s Results</span>
              <span className="text-slate-400">→</span>
            </Link>
          </div>
        </div>

        <Performance />
        <Announcements />
      </div>
    </div>
  );
}