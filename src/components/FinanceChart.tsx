"use client";

import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Props = {
  data: { name: string; income: number; expense: number }[];
};

// Compact Y-Axis Numbers Formatter (e.g., 50000 -> Rs 50k)
const formatYAxis = (value: number) => {
  if (value >= 1000000) return `Rs ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `Rs ${(value / 1000).toFixed(0)}k`;
  return `Rs ${value}`;
};

const FinanceChart = ({ data }: Props) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm w-full h-full p-5 flex flex-col">
      {/* TITLE */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-base font-bold text-slate-900">Finance Overview</h1>
        <Image src="/moreDark.png" alt="" width={16} height={16} className="opacity-40" />
      </div>

      {/* CHART */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              width={65} // ✅ Fixed: Sufficient width for Y-Axis labels
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              tickFormatter={formatYAxis} // ✅ Fixed: Compact formatting (Rs 50k)
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => [`Rs ${value.toLocaleString("en-PK")}`, undefined]}
            />
            <Legend
              align="center"
              verticalAlign="top"
              wrapperStyle={{ paddingTop: "0px", paddingBottom: "20px" }}
            />

            <Line
              type="monotone"
              name="Income"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={4}
              dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              name="Expense"
              dataKey="expense"
              stroke="#f43f5e"
              strokeWidth={4}
              dot={{ r: 4, fill: "#f43f5e", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinanceChart;