import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import EventCalendar from "@/components/EventCalendar";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";

export default async function StudentDashboard() {
  const { userId } = await getAuthUser();

  const student = userId
    ? await prisma.student.findUnique({
        where: { id: userId },
        include: { class: true },
      })
    : null;

  const classId = student?.classId;

  const lessons = classId
    ? await prisma.lesson.findMany({
        where: { classId },
        include: { subject: true, teacher: true },
      })
    : [];

  const events = await prisma.event.findMany({
    where: {
      OR: [{ classId: null }, { classId: classId || undefined }],
      startTime: { gte: new Date() },
    },
    take: 5,
  });

  const announcements = await prisma.announcement.findMany({
    where: {
      OR: [{ classId: null }, { classId: classId || undefined }],
    },
    take: 5,
  });

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row flex-1">
      <div className="w-full xl:w-2/3">
        <div className="p-4 bg-white rounded-md h-[600px]">
          <h1 className="text-xl font-semibold mb-4">
            Schedule ({student?.class?.name || "No Class Assigned"})
          </h1>
          <BigCalendar lessons={JSON.parse(JSON.stringify(lessons))} />
        </div>
      </div>

      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendar events={JSON.parse(JSON.stringify(events))} />
        <Announcements announcements={JSON.parse(JSON.stringify(announcements))} />
      </div>
    </div>
  );
}