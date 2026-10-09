import Announcements from "@/components/Announcements";
import AttendanceChart from "@/components/AttandanceChart";

import CountCharts from "@/components/CountCharts";
import EventCalendar from "@/components/EventCalendar";
import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/UserCard";
import prisma from "@/lib/prisma";

export default async function AdminPage() {
  // 1. FETCH ALL DATA IN PARALLEL
  const [
    studentsCount,
    teachersCount,
    parentsCount,
    adminsCount,
    boysCount,
    girlsCount,
    attendanceRaw,
    events,
    announcements,
    transactionsRaw, 
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.parent.count(),
    prisma.admin.count(),
    prisma.student.count({ where: { sex: "MALE" } }),
    prisma.student.count({ where: { sex: "FEMALE" } }),
    // Last 7 days attendance
    prisma.attendance.findMany({
      where: { date: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) } },
      select: { date: true, present: true },
    }),
    // Upcoming 5 Events
    prisma.event.findMany({ 
      take: 5, 
      orderBy: { startTime: "asc" }, 
      where: { startTime: { gte: new Date() } }, 
      include: { class: true } 
    }),
    // Latest 3 Announcements
    prisma.announcement.findMany({ 
      take: 3, 
      orderBy: { date: "desc" }, 
      include: { class: true } 
    }),
    // Current Year Transactions
    prisma.transaction.findMany({
      where: { date: { gte: new Date(new Date().getFullYear(), 0, 1) } },
      select: { amount: true, type: true, date: true }
    })
  ]);

  // 2. FORMAT ATTENDANCE DATA
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

  // 3. FORMAT FINANCE DATA
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const financeMap: Record<string, { income: number; expense: number }> = {};
  
  months.forEach(m => (financeMap[m] = { income: 0, expense: 0 }));

  transactionsRaw.forEach((t) => {
    const monthName = months[t.date.getMonth()]; 
    if (t.type === "INCOME") {
      financeMap[monthName].income += t.amount;
    } else {
      financeMap[monthName].expense += t.amount;
    }
  });

  const financeData = months.map((name) => ({
    name,
    income: financeMap[name].income,
    expense: financeMap[name].expense,
  }));

  // 4. FORMAT GENDER PERCENTAGES
  const totalStudents = boysCount + girlsCount || 1;
  const boysPercent = Math.round((boysCount / totalStudents) * 100);
  const girlsPercent = Math.round((girlsCount / totalStudents) * 100);

  // 5. SERIALIZE DATES FOR CLIENT COMPONENTS
  const safeEvents = JSON.parse(JSON.stringify(events));
  const safeAnnouncements = JSON.parse(JSON.stringify(announcements));

  return (
    <div className="w-full p-4 md:p-6 flex flex-col lg:flex-row gap-6">
      {/* LEFT CONTENT AREA */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        
        {/* TOP ROW: STAT CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="students" count={studentsCount} />
          <UserCard type="teachers" count={teachersCount} />
          <UserCard type="parents" count={parentsCount} />
          <UserCard type="staffs" count={adminsCount} />
        </div>

        {/* MIDDLE ROW: GENDER & ATTENDANCE CHARTS */}
        <div className="flex gap-6 flex-col md:flex-row h-auto md:h-[400px]">
          <div className="w-full md:w-1/3 h-[400px] md:h-full">
            <CountCharts
              boys={boysCount}
              girls={girlsCount}
              boysPercent={boysPercent}
              girlsPercent={girlsPercent}
            />
          </div>
          <div className="w-full md:w-2/3 h-[400px] md:h-full">
            <AttendanceChart data={attendanceData} />
          </div>
        </div>

        {/* BOTTOM ROW: FINANCE CHART */}
        <div className="w-full h-[450px]">
          <FinanceChart data={financeData} /> 
        </div>
      </div>

      {/* RIGHT SIDEBAR AREA */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        <EventCalendar events={safeEvents} />
        <Announcements announcements={safeAnnouncements} />
      </div>
    </div>
  );
}