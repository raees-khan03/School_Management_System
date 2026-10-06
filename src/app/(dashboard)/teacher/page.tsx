import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import EventCalendar from "@/components/EventCalendar";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import Image from "next/image";

export default async function TeacherDashboard() {
  const { userId } = await getAuthUser();

  // 1. Fetch teacher's REAL LESSONS
  const lessons = userId
    ? await prisma.lesson.findMany({
        where: { teacherId: userId },
        include: { subject: true, class: true },
      })
    : [];

  const events = await prisma.event.findMany({
    take: 5,
    orderBy: { startTime: "asc" },
    where: { startTime: { gte: new Date() } },
  });

  const announcements = await prisma.announcement.findMany({
    take: 5,
    orderBy: { date: "desc" },
  });

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row flex-1">
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        <div className="bg-white rounded-md p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome Back!</h1>
            <p className="text-sm text-slate-500 mt-1">Check your schedule and upcoming classes below.</p>
          </div>
          <Image src="/teacher.png" alt="teacher" width={50} height={50} className="opacity-70" />
        </div>

        <div className="p-4 bg-white rounded-md h-[600px]">
          <h1 className="text-xl font-semibold mb-4">My Schedule</h1>
          {/* Direct Prisma lessons pass kiye */}
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