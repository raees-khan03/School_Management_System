import Announcements from "@/components/Announcements";
import AttendanceChart from "@/components/AttandanceChart";
// agar file AttandanceChart hai to wahi naam use karein
import CountCharts from "@/components/CountCharts";
import EventCalendar from "@/components/EventCalendar";
import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/UserCard";
import prisma from "@/lib/prisma";

export default async function AdminPage() {
  // ===== REAL DATA FROM NEON =====
  const [studentsCount, teachersCount, parentsCount, adminsCount, boysCount, girlsCount] =
    await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.parent.count(),
      prisma.admin.count(),
      prisma.student.count({ where: { sex: "MALE" } }),
      prisma.student.count({ where: { sex: "FEMALE" } }),
    ]);

  // Attendance last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const attendanceRaw = await prisma.attendance.findMany({
    where: { date: { gte: weekAgo } },
    select: { date: true, present: true },
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const attendanceMap: Record<string, { present: number; absent: number }> = {
    Mon: { present: 0, absent: 0 },
    Tue: { present: 0, absent: 0 },
    Wed: { present: 0, absent: 0 },
    Thu: { present: 0, absent: 0 },
    Fri: { present: 0, absent: 0 },
    Sat: { present: 0, absent: 0 },
  };

  for (const row of attendanceRaw) {
    const key = dayNames[new Date(row.date).getDay()];
    if (attendanceMap[key]) {
      if (row.present) attendanceMap[key].present += 1;
      else attendanceMap[key].absent += 1;
    }
  }

  const attendanceData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((name) => ({
    name,
    present: attendanceMap[name].present,
    absent: attendanceMap[name].absent,
  }));

  // Events — upcoming pehle, warna latest 5
  let events = await prisma.event.findMany({
    where: { startTime: { gte: new Date() } },
    orderBy: { startTime: "asc" },
    take: 5,
    include: { class: true },
  });

  if (events.length === 0) {
    events = await prisma.event.findMany({
      orderBy: { startTime: "desc" },
      take: 5,
      include: { class: true },
    });
  }

  const announcements = await prisma.announcement.findMany({
    orderBy: { date: "desc" },
    take: 3,
    include: { class: true },
  });

  // Client components ke liye dates serialize
  const safeEvents = JSON.parse(JSON.stringify(events));
  const safeAnnouncements = JSON.parse(JSON.stringify(announcements));

  const totalGender = boysCount + girlsCount;
  const boysPercent = totalGender ? Math.round((boysCount / totalGender) * 100) : 0;
  const girlsPercent = totalGender ? Math.round((girlsCount / totalGender) * 100) : 0;

  console.log("DASHBOARD COUNTS:", {
    studentsCount,
    teachersCount,
    parentsCount,
    adminsCount,
    boysCount,
    girlsCount,
    events: events.length,
    announcements: announcements.length,
    attendanceRows: attendanceRaw.length,
  });

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full md:w-2/3 space-y-4">
        {/* CARDS — REAL COUNTS */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="students" count={studentsCount} />
          <UserCard type="teachers" count={teachersCount} />
          <UserCard type="parents" count={parentsCount} />
          <UserCard type="staffs" count={adminsCount} />
        </div>

        <div className="flex gap-4 flex-col md:flex-row">
          <div className="w-full md:w-1/3 h-[450px]">
            <CountCharts
              boys={boysCount}
              girls={girlsCount}
              boysPercent={boysPercent}
              girlsPercent={girlsPercent}
            />
          </div>
          <div className="w-full md:w-2/3 h-[450px]">
            <AttendanceChart data={attendanceData} />
          </div>
        </div>

        <div className="w-full h-[500px]">
          <FinanceChart />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full md:w-1/3 flex flex-col gap-8">
        <EventCalendar events={safeEvents} />
        <Announcements announcements={safeAnnouncements} />
      </div>
    </div>
  );
}