"use client";

import Image from "next/image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Props = {
  data: { name: string; present: number; absent: number }[];
};

const AttendanceChart = ({ data }: Props) => {
  const chartData =
    data?.length > 0
      ? data
      : [
          { name: "Mon", present: 0, absent: 0 },
          { name: "Tue", present: 0, absent: 0 },
          { name: "Wed", present: 0, absent: 0 },
          { name: "Thu", present: 0, absent: 0 },
          { name: "Fri", present: 0, absent: 0 },
          { name: "Sat", present: 0, absent: 0 },
        ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 w-full h-full p-5 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-base font-bold text-slate-900">Attendance Overview</h1>
        <Image src="/moreDark.png" alt="" width={16} height={16} className="opacity-40" />
      </div>

      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={chartData} barSize={16}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
          />
          <Legend
            align="left"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }}
          />
          <Bar name="Present" dataKey="present" fill="#0d9488" radius={[6, 6, 0, 0]} /> {/* Teal / Emerald */}
          <Bar name="Absent" dataKey="absent" fill="#f43f5e" radius={[6, 6, 0, 0]} /> {/* Rose Red */}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;