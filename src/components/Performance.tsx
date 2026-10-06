"use client";

import Image from "next/image";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

const data = [
  {
    name: "Score",
    value: 92,
    fill: "#C3EBFA",
  },
];

const Performance = () => {
  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Performance</h1>
        <Image src="/moreDark.png" alt="more" width={16} height={16} />
      </div>
      <div className="relative w-full h-64">
        <ResponsiveContainer>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={32}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar background dataKey="value" cornerRadius={20} />
          </RadialBarChart>
        </ResponsiveContainer>
        <h1 className="absolute top-14 left-0 right-0 m-auto text-3xl font-bold text-center">
          9.2
        </h1>
        <p className="absolute top-24 left-0 right-0 m-auto text-sm text-center text-gray-400">
          of 10 max LTS
        </p>
      </div>
      <h2 className="font-medium mb-6 m-auto text-center text-gray-400">
        1st Semester - 2nd Semester
      </h2>
    </div>
  );
};

export default Performance;