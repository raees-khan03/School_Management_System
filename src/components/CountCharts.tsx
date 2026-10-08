"use client";

import Image from "next/image";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

type Props = {
  boys: number;
  girls: number;
  boysPercent: number;
  girlsPercent: number;
};

const CountCharts = ({ boys = 0, girls = 0, boysPercent = 0, girlsPercent = 0 }: Props) => {
  const total = boys + girls;

  const data = [
    { name: "Total", count: total || 1, fill: "#f8fafc" },
    { name: "Girls", count: girls, fill: "#f59e0b" }, // Amber
    { name: "Boys", count: boys, fill: "#0ea5e9" },  // Sky
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 w-full h-full p-5 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <h1 className="text-base font-bold text-slate-900">Gender Distribution</h1>
        <Image src="/moreDark.png" alt="" width={16} height={16} className="opacity-40" />
      </div>

      <div className="relative w-full h-[65%]">
        <ResponsiveContainer>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="100%"
            barSize={24}
            data={data}
          >
            <RadialBar background dataKey="count" />
          </RadialBarChart>
        </ResponsiveContainer>
        <Image
          src="/maleFemale.png"
          alt=""
          width={40}
          height={40}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80"
        />
      </div>

      <div className="flex justify-around border-t border-slate-100 pt-3">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-sky-500 rounded-full" />
            <span className="text-xs font-semibold text-slate-500">Boys</span>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{boys}</p>
          <span className="text-[11px] font-medium text-slate-400">{boysPercent}%</span>
        </div>

        <div className="h-8 w-px bg-slate-100 self-center" />

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
            <span className="text-xs font-semibold text-slate-500">Girls</span>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{girls}</p>
          <span className="text-[11px] font-medium text-slate-400">{girlsPercent}%</span>
        </div>
      </div>
    </div>
  );
};

export default CountCharts;