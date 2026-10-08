import Announcements from "@/components/Announcements";
import FormModal from "@/components/FormModal";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import { Mail, Phone, MapPin, Users } from "lucide-react";

export default async function SingleParentPage({
  params,
}: {
  params: { id: string };
}) {
  const { role } = await getAuthUser();

  if (role !== "admin") {
    redirect("/");
  }

  const parent = await prisma.parent.findUnique({
    where: { id: params.id },
    include: {
      students: {
        include: {
          class: true,
          grade: true,
        },
      },
    },
  });

  if (!parent) return notFound();

  return (
    <div className="m-4 flex-1 flex flex-col gap-6 md:m-6 xl:flex-row">
      {/* LEFT SIDE */}
      <div className="w-full xl:w-2/3 flex flex-col gap-6">
        
        {/* TOP CARD */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex gap-6">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-teal-50 text-3xl font-bold text-teal-700 sm:h-32 sm:w-32">
              {parent.name[0]}{parent.surname[0]}
            </div>
            
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <h1 className="text-xl font-bold text-slate-900 truncate">
                    {parent.name} {parent.surname}
                  </h1>
                  {role === "admin" && (
                    <FormModal
                      table="parent"
                      type="update"
                      data={JSON.parse(JSON.stringify(parent))}
                      id={parent.id}
                    />
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  @{parent.username}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-medium text-slate-600">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="h-4 w-4 shrink-0 text-teal-600" />
                  <span className="truncate">{parent.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="h-4 w-4 shrink-0 text-teal-600" />
                  <span className="truncate tabular-nums">{parent.phone}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0 sm:col-span-2">
                  <MapPin className="h-4 w-4 shrink-0 text-teal-600" />
                  <span className="truncate">{parent.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* STAT CARD */}
          <div className="flex flex-1 flex-wrap gap-4">
            <div className="flex w-full min-w-[130px] flex-1 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <Users className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-bold tabular-nums text-slate-900">
                  {parent.students.length}
                </h2>
                <p className="truncate text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">
                  Linked Children
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LINKED STUDENTS LIST */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Children List</h2>
          <div className="flex flex-col gap-3">
            {parent.students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                     <Image
                        src={student.img || "/noAvatar.png"}
                        alt={student.name}
                        fill
                        sizes="40px"
                        unoptimized
                        className="object-cover"
                      />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {student.name} {student.surname}
                    </h3>
                    <p className="truncate text-xs text-slate-500 mt-0.5">
                      Class: {student.class?.name || "-"} <span className="mx-1 text-slate-300">•</span> Grade: {student.grade?.level || "-"}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/list/students/${student.id}`}
                  className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50"
                >
                  View Profile
                </Link>
              </div>
            ))}

            {parent.students.length === 0 && (
              <p className="text-sm text-slate-500 italic py-4 text-center">
                No students currently linked to this parent.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full xl:w-1/3 flex flex-col gap-6">
        <Announcements />
      </div>
    </div>
  );
}