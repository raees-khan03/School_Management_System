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
} from "lucide-react";

import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import FormModal from "@/components/FormModal";
import BigCalendar from "@/components/BigCalender";
import Announcements from "@/components/Announcements";
import Performance from "@/components/Performance";

export default async function SingleStudentPage({
  params,
}: {
  params: { id: string };
}) {
  const { role, userId } = await getAuthUser();

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

  // Security check: Only Admin, Teachers, the Student themselves, or their Parent can view this
  if (role === "student" && userId !== student.id) redirect("/");
  if (role === "parent" && userId !== student.parentId) redirect("/");

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 xl:flex-row bg-slate-50">
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
                    {new Intl.DateTimeFormat("en-GB", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(student.birthday))}
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
                <Award className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold tabular-nums text-slate-900">{student.grade?.level || "-"}th</h2>
                <p className="truncate text-xs font-medium text-slate-500">Grade Level</p>
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

        {/* SCHEDULE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-[800px] flex flex-col">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Student&apos;s Schedule</h2>
          <div className="flex-1 min-h-0">
            {/* Pass the real formatted lessons from the student's class to the BigCalendar */}
            <BigCalendar lessons={JSON.parse(JSON.stringify(student.class?.lessons || []))} />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full xl:w-1/3 flex flex-col gap-6">
        
        {/* SHORTCUTS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div className="flex flex-col gap-3 text-sm font-medium">
            
            {/* The New Report Card Button */}
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
        
        {/* PERFORMANCE & ANNOUNCEMENTS */}
        <Performance />
        <Announcements />
      </div>
    </div>
  );
}