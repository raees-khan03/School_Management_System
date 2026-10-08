import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Droplet,
  User,
  AtSign,
  ShieldCheck,
  ArrowUpRight,
  ChevronRight,
  BookOpen,
  Layers,
  School,
  GraduationCap,
  Users,
  ClipboardList,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import FormModal from "@/components/FormModal";

type Stat = { label: string; value: string | number; icon: LucideIcon };

const formatDate = (d?: string | Date | null) => {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

export default async function ProfilePage() {
  const { userId, role } = await getAuthUser();

  if (!userId || !role) {
    redirect("/");
  }

  // ===== 1. Fetch user data based on role =====
  let user: any = null;
  let extraStats: Stat[] = [];

  if (role === "teacher") {
    user = await prisma.teacher.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { subjects: true, lessons: true, classes: true } },
      },
    });
    if (user) {
      extraStats = [
        { label: "Subjects", value: user._count.subjects, icon: BookOpen },
        { label: "Lessons", value: user._count.lessons, icon: Layers },
        { label: "Classes", value: user._count.classes, icon: School },
      ];
    }
  } else if (role === "student") {
    user = await prisma.student.findUnique({
      where: { id: userId },
      include: {
        class: true,
        grade: true,
        _count: { select: { results: true, attendances: true } },
      },
    });
    if (user) {
      extraStats = [
        { label: "Grade", value: `${user.grade?.level || "-"}th`, icon: GraduationCap },
        { label: "Class", value: user.class?.name || "-", icon: School },
        { label: "Results", value: user._count.results, icon: ClipboardList },
      ];
    }
  } else if (role === "parent") {
    user = await prisma.parent.findUnique({
      where: { id: userId },
      include: { students: { include: { class: true } } },
    });
    if (user) {
      extraStats = [{ label: "Children", value: user.students.length, icon: Users }];
    }
  } else if (role === "admin") {
    user = await prisma.admin.findUnique({ where: { id: userId } });

    const [teachers, students, parents, classes] = await Promise.all([
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.parent.count(),
      prisma.class.count(),
    ]);

    extraStats = [
      { label: "Teachers", value: teachers, icon: UserRound },
      { label: "Students", value: students, icon: GraduationCap },
      { label: "Parents", value: parents, icon: Users },
      { label: "Classes", value: classes, icon: School },
    ];
  }

  if (!user) {
    return (
      <div className="m-4 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Profile not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your profile record is missing in the database. Please contact admin to sync your account.
        </p>
      </div>
    );
  }

  const fullName = `${user.name || ""} ${user.surname || ""}`.trim() || user.username;
  const serializedUser = JSON.parse(JSON.stringify(user));
  const birthday = formatDate(user.birthday);
  const joinedOn = formatDate(user.createdAt);
  const gender = user.sex ? user.sex.charAt(0) + user.sex.slice(1).toLowerCase() : null;

  const contacts = [
    { icon: Mail, label: "Email", value: user.email },
    { icon: Phone, label: "Phone", value: user.phone },
    { icon: MapPin, label: "Address", value: user.address },
  ].filter((c) => c.value);

  const details = [
    { icon: AtSign, label: "Username", value: user.username },
    { icon: User, label: "Gender", value: gender },
    { icon: Calendar, label: "Date of birth", value: birthday },
    { icon: Droplet, label: "Blood type", value: user.bloodType },
    { icon: Clock, label: "Joined", value: joinedOn },
  ].filter((d) => d.value);

  const quickLinks: { href: string; label: string }[] =
    role === "admin"
      ? [
          { href: "/list/teachers", label: "Teachers" },
          { href: "/list/students", label: "Students" },
          { href: "/list/classes", label: "Classes" },
          { href: "/list/subjects", label: "Subjects" },
        ]
      : role === "teacher"
      ? [
          { href: "/list/classes", label: "My classes" },
          { href: "/list/lessons", label: "My lessons" },
          { href: "/list/exams", label: "My exams" },
          { href: "/list/results", label: "My results" },
        ]
      : role === "student"
      ? [
          { href: "/list/results", label: "My results" },
          { href: "/list/assignments", label: "Assignments" },
          { href: "/list/exams", label: "My exams" },
        ]
      : [
          { href: "/list/results", label: "Children results" },
          { href: "/list/assignments", label: "Assignments" },
          { href: "/list/announcements", label: "Announcements" },
        ];

  return (
    <div className="p-4 md:p-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Banner (sidebar jaisa dark + teal glow) */}
        <div className="relative h-36 bg-slate-950 bg-[radial-gradient(circle_at_top_left,rgb(20_184_166/0.35),transparent_55%)] md:h-44">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgb(255_255_255/0.06),transparent_50%)]" />
        </div>

        {/* Header */}
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col items-center gap-4 sm:-mt-14 sm:flex-row sm:items-end">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-md sm:h-28 sm:w-28">
              <Image
                src={user.img || "/noAvatar.png"}
                alt={fullName}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
                  {fullName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium capitalize text-teal-700 ring-1 ring-inset ring-teal-600/20">
                  <ShieldCheck className="h-3 w-3" />
                  {role}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">@{user.username}</p>
            </div>

            {role !== "admin" && (
              <div className="sm:pb-1">
                <FormModal
                  table={role as "teacher" | "student" | "parent"}
                  type="update"
                  data={serializedUser}
                  id={user.id}
                />
              </div>
            )}
          </div>

          {/* Stats strip */}
          {extraStats.length > 0 && (
            <div
              className="mt-6 grid divide-x divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 sm:divide-y-0"
              style={{
                gridTemplateColumns: `repeat(${Math.min(extraStats.length, 4)}, minmax(0, 1fr))`,
              }}
            >
              {extraStats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-4">
                  <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 sm:flex">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xl font-semibold leading-tight text-slate-900">{value}</p>
                    <p className="truncate text-xs text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {contacts.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Contact</h2>
              <ul className="mt-4 space-y-4">
                {contacts.map(({ icon: Icon, label, value }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="break-words text-sm font-medium text-slate-900">{value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Account</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd className="flex items-center gap-1.5 font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Role</dt>
                <dd className="font-medium capitalize text-slate-900">{role}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">User ID</dt>
                <dd className="max-w-[140px] truncate font-mono text-xs text-slate-600">
                  {user.id}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Personal info tiles */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Personal information</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {details.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-teal-600 shadow-sm ring-1 ring-slate-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="truncate text-sm font-medium text-slate-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Children (parent) */}
          {role === "parent" && user.students?.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">My children</h2>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {user.students.map((s: any) => (
                  <li key={s.id}>
                    <Link
                      href={`/list/students/${s.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-teal-300 hover:bg-teal-50/40"
                    >
                      <Image
                        src={s.img || "/noAvatar.png"}
                        alt={s.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {s.name} {s.surname}
                        </p>
                        <p className="text-xs text-slate-500">Class {s.class?.name || "-"}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Quick access tiles */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Quick access</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[...quickLinks, { href: "/settings", label: "Settings" }].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:bg-teal-50/40 hover:text-teal-800"
                >
                  {l.label}
                  <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-teal-600" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}