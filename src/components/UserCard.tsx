import Image from "next/image";

type Props = {
  type: "students" | "teachers" | "parents" | "staffs" | string;
  count: number;
};

const UserCard = ({ type, count }: Props) => {
  // Brand matched accent borders & badges
  const cardThemes: Record<string, { bg: string; text: string; border: string }> = {
    students: { bg: "bg-indigo-50/50", text: "text-indigo-600", border: "border-indigo-100" },
    teachers: { bg: "bg-teal-50/50", text: "text-teal-600", border: "border-teal-100" },
    parents: { bg: "bg-emerald-50/50", text: "text-emerald-600", border: "border-emerald-100" },
    staffs: { bg: "bg-amber-50/50", text: "text-amber-600", border: "border-amber-100" },
  };

  const theme = cardThemes[type] || { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" };

  return (
    <div className={`bg-white rounded-2xl border ${theme.border} p-5 flex-1 min-w-[140px] shadow-sm hover:shadow-md transition-all`}>
      <div className="flex justify-between items-center">
        <span className={`text-[11px] font-semibold ${theme.bg} ${theme.text} px-2.5 py-1 rounded-full border ${theme.border}`}>
          2025/26
        </span>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <Image src="/moreDark.png" alt="" width={16} height={16} className="opacity-40" />
        </button>
      </div>

      <div className="mt-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {(count ?? 0).toLocaleString()}
        </h1>
        <h2 className="capitalize text-xs font-semibold text-slate-500 mt-1">
          Total {type}
        </h2>
      </div>
    </div>
  );
};

export default UserCard;