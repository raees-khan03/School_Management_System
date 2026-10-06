import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import EventCalendar from "@/components/EventCalendar";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import { redirect } from "next/navigation";

export default async function ParentDashboard() {
  const { userId, role } = await getAuthUser();

  if (role === "admin") redirect("/list/parents");

  const students = userId
    ? await prisma.student.findMany({
        where: { parentId: userId },
        include: {
          class: {
            include: {
              lessons: { include: { subject: true, teacher: true } },
            },
          },
        },
      })
    : [];

  const classIds = students.map((s) => s.classId);

  const events = await prisma.event.findMany({
    where: {
      OR: [{ classId: null }, { classId: { in: classIds } }],
      startTime: { gte: new Date() },
    },
    take: 5,
  });

  const announcements = await prisma.announcement.findMany({
    where: {
      OR: [{ classId: null }, { classId: { in: classIds } }],
    },
    take: 5,
  });

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row flex-1">
      <div className="w-full xl:w-2/3 flex flex-col gap-8">
        {students.map((student) => (
          <div key={student.id} className="p-4 bg-white rounded-md">
            <h1 className="text-xl font-semibold mb-4">
              Schedule ({student.name} {student.surname} - {student.class.name})
            </h1>
            <div className="h-[600px]">
              <BigCalendar lessons={JSON.parse(JSON.stringify(student.class.lessons))} />
            </div>
          </div>
        ))}

        {students.length === 0 && (
          <div className="p-8 bg-white rounded-md text-center text-gray-500">
            No children registered under your parent account.
          </div>
        )}
      </div>

      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendar events={JSON.parse(JSON.stringify(events))} />
        <Announcements announcements={JSON.parse(JSON.stringify(announcements))} />
      </div>
    </div>
  );
}