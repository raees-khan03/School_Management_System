import Announcements from "@/components/Announcements";
import FormModal from "@/components/FormModal";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";

const SingleParentPage = async ({
  params,
}: {
  params: { id: string };
}) => {
  const { role } = await getAuthUser();

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

  if (!parent) {
    return notFound();
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT SIDE */}
      <div className="w-full xl:w-2/3">
        {/* TOP CARD */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3 flex items-center justify-center">
              <div className="w-28 h-20 bg-white/60 rounded-full flex items-center justify-center text-xl font-bold text-indigo-700">
                {parent.name[0]}{parent.surname[0]}
              </div>
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {parent.name} {parent.surname}
                </h1>
                {role === "admin" && (
                  <FormModal
                    table="parent"
                    type="update"
                    data={parent}
                    id={parent.id}
                  />
                )}
              </div>
              <p className="text-sm text-gray-500">
                Username: @{parent.username}
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="mail" width={14} height={14} />
                  <span>{parent.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="phone" width={14} height={14} />
                  <span>{parent.phone}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/address.png" alt="address" width={14} height={14} />
                  <span>{parent.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* STAT CARD */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <div className="bg-white p-4 rounded-md flex gap-4 w-full">
              <Image
                src="/singleClass.png"
                alt="students"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">
                  {parent.students.length}
                </h1>
                <span className="text-sm text-gray-400">Linked Students (Children)</span>
              </div>
            </div>
          </div>
        </div>

        {/* LINKED STUDENTS LIST */}
        <div className="mt-4 bg-white rounded-md p-4">
          <h1 className="text-xl font-semibold mb-4">Children List</h1>
          <div className="flex flex-col gap-3">
            {parent.students.map((student) => (
              <div
                key={student.id}
                className="p-3 border rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={student.img || "/noAvatar.png"}
                    alt={student.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-sm font-semibold">
                      {student.name} {student.surname}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Class: {student.class.name} | Grade: {student.grade.level}th
                    </p>
                  </div>
                </div>
                <Link
                  href={`/list/students/${student.id}`}
                  className="text-xs text-indigo-600 hover:underline font-medium"
                >
                  View Profile →
                </Link>
              </div>
            ))}

            {parent.students.length === 0 && (
              <p className="text-sm text-gray-400">No students assigned to this parent yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <Announcements />
      </div>
    </div>
  );
};

export default SingleParentPage;