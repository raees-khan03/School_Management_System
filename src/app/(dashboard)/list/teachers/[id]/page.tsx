import BigCalendar from "@/components/BigCalender";
import Announcements from "@/components/Announcements";
import Performance from "@/components/Performance";
import FormModal from "@/components/FormModal";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import { Droplet, Calendar, Mail, Phone, CheckCircle2, BookOpen, MonitorPlay, Users } from "lucide-react";

export default async function SingleTeacherPage({
  params,
}: {
  params: { id: string };
}) {
  const { role } = await getAuthUser();

  // Protect route if needed, usually Admin handles this or Teachers viewing peers
  if (role !== "admin" && role !== "teacher") {
    redirect("/");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: params.id },
    include: {
      subjects: true,
      classes: true,
      lessons: true,
      _count: {
        select: {
          subjects: true,
          lessons: true,
          classes: true,
        },
      },
    },
  });

  if (!teacher) {
    return notFound();
  }

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-6">
        {/* TOP CARDS */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* USER INFO CARD */}
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex gap-6">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-50 sm:h-32 sm:w-32">
              <Image
                src={teacher.img || "/noAvatar.png"}
                alt={`${teacher.name} ${teacher.surname}`}
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
                    {teacher.name} {teacher.surname}
                  </h1>
                  {role === "admin" && (
                    <FormModal
                      table="teacher"
                      type="update"
                      data={JSON.parse(JSON.stringify(teacher))}
                      id={teacher.id}
                    />
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500 line-clamp-1">
                  {teacher.subjects.map((s) => s.name).join(", ") || "No subjects assigned"}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-teal-600 shrink-0" />
                  <span className="truncate">{teacher.bloodType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-600 shrink-0" />
                  <span className="truncate tabular-nums">
                    {new Intl.DateTimeFormat("en-GB", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(teacher.birthday))}
                  </span>
                </div>
                {/* Hide private info from other teachers */}
                {role === "admin" && (
                  <>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-teal-600 shrink-0" />
                      <span className="truncate">{teacher.email || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-teal-600 shrink-0" />
                      <span className="truncate tabular-nums">{teacher.phone || "-"}</span>
                    </div>
                  </>
                )}
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
                <h2 className="truncate text-xl font-bold tabular-nums text-slate-900">98%</h2>
                <p className="truncate text-xs font-medium text-slate-500">Attendance</p>
              </div>
            </div>
            <div className="flex w-full min-w-[130px] flex-1 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:w-auto">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold tabular-nums text-slate-900">{teacher._count.subjects}</h2>
                <p className="truncate text-xs font-medium text-slate-500">Subjects</p>
              </div>
            </div>
            <div className="flex w-full min-w-[130px] flex-1 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:w-auto">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <MonitorPlay className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold tabular-nums text-slate-900">{teacher._count.lessons}</h2>
                <p className="truncate text-xs font-medium text-slate-500">Lessons</p>
              </div>
            </div>
            <div className="flex w-full min-w-[130px] flex-1 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:w-auto">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold tabular-nums text-slate-900">{teacher._count.classes}</h2>
                <p className="truncate text-xs font-medium text-slate-500">Classes</p>
              </div>
            </div>
          </div>
        </div>

        {/* SCHEDULE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-[800px] flex flex-col">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Teacher&apos;s Schedule</h2>
          <div className="flex-1 min-h-0">
            <BigCalendar lessons={JSON.parse(JSON.stringify(teacher.lessons))} />
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Shortcuts</h2>
          <div className="flex flex-wrap gap-2 text-sm font-medium">
            <Link
              href={`/list/classes?supervisorId=${teacher.id}`}
              className="rounded-lg bg-teal-50 px-3 py-2 text-teal-700 transition hover:bg-teal-100"
            >
              Teacher&apos;s Classes
            </Link>
            <Link
              href={`/list/students?teacherId=${teacher.id}`}
              className="rounded-lg bg-indigo-50 px-3 py-2 text-indigo-700 transition hover:bg-indigo-100"
            >
              Teacher&apos;s Students
            </Link>
            <Link
              href={`/list/lessons?teacherId=${teacher.id}`}
              className="rounded-lg bg-amber-50 px-3 py-2 text-amber-700 transition hover:bg-amber-100"
            >
              Teacher&apos;s Lessons
            </Link>
            <Link
              href={`/list/exams?teacherId=${teacher.id}`}
              className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 transition hover:bg-emerald-100"
            >
              Teacher&apos;s Exams
            </Link>
            <Link
              href={`/list/assignments?teacherId=${teacher.id}`}
              className="rounded-lg bg-blue-50 px-3 py-2 text-blue-700 transition hover:bg-blue-100"
            >
              Teacher&apos;s Assignments
            </Link>
          </div>
        </div>

        <Performance />
        <Announcements />
      </div>
    </div>
  );
}