import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormModal from "@/components/FormModal";
import FilterButton from "@/components/FilterButton";
import SortButton from "@/components/SortButton";
import ClearFiltersButton from "@/components/ClearFiltersButton";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import { CheckCircle2, XCircle } from "lucide-react";

const ITEM_PER_PAGE = 10;

const formatDate = (v: Date | string) => {
  const d = new Date(v);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
};

export default async function AttendanceListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { role, userId } = await getAuthUser();

  const columns = [
    { header: "Student", accessor: "student" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Lesson", accessor: "lesson", className: "hidden md:table-cell" },
    { header: "Date", accessor: "date", className: "hidden lg:table-cell" },
    { header: "Status", accessor: "status" },
    ...(role === "admin" || role === "teacher"
      ? [{ header: "Actions", accessor: "action", align: "right" as const }]
      : []),
  ];

  const { page, sort, ...queryParams } = searchParams;
  const p = page ? Math.max(1, parseInt(page) || 1) : 1;
  const sortOrder = sort === "desc" ? "desc" : "asc";

  const query: any = {};

  for (const [key, value] of Object.entries(queryParams)) {
    if (!value) continue;
    switch (key) {
      case "search":
        query.student = {
          OR: [
            { name: { contains: value, mode: "insensitive" } },
            { surname: { contains: value, mode: "insensitive" } },
          ],
        };
        break;
      case "classId":
        query.lesson = { ...(query.lesson || {}), classId: parseInt(value) };
        break;
      default:
        break;
    }
  }

  if (role !== "admin" && userId) {
    if (role === "teacher") {
      query.lesson = { ...(query.lesson || {}), teacherId: userId };
    } else if (role === "student") {
      query.studentId = userId;
    } else if (role === "parent") {
      query.student = { parentId: userId };
    }
  }

  const [attendance, count, classes] = await prisma.$transaction([
    prisma.attendance.findMany({
      where: query,
      include: {
        student: true,
        lesson: { include: { class: true, subject: true } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { date: sortOrder },
    }),
    prisma.attendance.count({ where: query }),
    prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const renderRow = (item: any) => {
    const studentName = `${item.student?.name ?? ""} ${item.student?.surname ?? ""}`.trim();
    const className = item.lesson?.class?.name ?? "-";
    const lessonName = item.lesson?.subject?.name ?? item.lesson?.name ?? "-";

    return (
      <tr key={item.id} className="text-sm">
        <td>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-900 truncate">{studentName || "-"}</span>
            <span className="text-xs text-slate-500 md:hidden mt-0.5 truncate">
              {className} · {lessonName}
            </span>
          </div>
        </td>
        <td className="hidden md:table-cell font-medium text-slate-700">{className}</td>
        <td className="hidden md:table-cell">{lessonName}</td>
        <td className="hidden lg:table-cell whitespace-nowrap tabular-nums">
          {formatDate(item.date)}
        </td>
        <td>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
              item.present
                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                : "bg-red-50 text-red-700 ring-red-600/15"
            }`}
          >
            {item.present ? (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <XCircle className="h-3.5 w-3.5" aria-hidden />
            )}
            {item.present ? "Present" : "Absent"}
          </span>
        </td>
        {(role === "admin" || role === "teacher") && (
          <td>
            <div className="flex items-center justify-end gap-2">
              <FormModal
                table="attendance"
                type="update"
                data={JSON.parse(JSON.stringify(item))}
                id={item.id}
              />
              {role === "admin" && (
                <FormModal table="attendance" type="delete" id={item.id} />
              )}
            </div>
          </td>
        )}
      </tr>
    );
  };

  return (
    <div className="m-4 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:m-6 md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Attendance</h1>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <TableSearch />
          <div className="flex items-center gap-2 self-end md:self-auto">
            <FilterButton
              param="classId"
              label="Class"
              options={classes.map((c) => ({ label: c.name, value: String(c.id) }))}
            />
            <SortButton />
            <ClearFiltersButton />
            {(role === "admin" || role === "teacher") && (
              <FormModal table="attendance" type="create" />
            )}
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        renderRow={renderRow}
        data={attendance}
        emptyMessage="No attendance records yet."
      />
      <Pagination page={p} count={count} />
    </div>
  );
}