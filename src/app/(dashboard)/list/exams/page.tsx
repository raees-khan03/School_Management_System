import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormModal from "@/components/FormModal";
import FilterButton from "@/components/FilterButton";
import SortButton from "@/components/SortButton";
import ClearFiltersButton from "@/components/ClearFiltersButton";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";

const ITEM_PER_PAGE = 10;

const formatDateTime = (value: Date | string) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

export default async function ExamsListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { role, userId } = await getAuthUser();

  const columns = [
    { header: "Exam / Subject", accessor: "subject" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
    { header: "Start", accessor: "start", className: "hidden lg:table-cell" },
    { header: "End", accessor: "end", className: "hidden lg:table-cell" },
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
        query.OR = [
          { title: { contains: value, mode: "insensitive" } },
          { lesson: { subject: { name: { contains: value, mode: "insensitive" } } } },
        ];
        break;
      case "classId":
        query.lesson = { ...(query.lesson || {}), classId: parseInt(value) };
        break;
      case "teacherId":
        query.lesson = { ...(query.lesson || {}), teacherId: value };
        break;
      default:
        break;
    }
  }

  if (role === "teacher" && userId) {
    query.lesson = { ...(query.lesson || {}), teacherId: userId };
  } else if (role === "student" && userId) {
    const student = await prisma.student.findUnique({
      where: { id: userId },
      select: { classId: true },
    });
    if (student?.classId) {
      query.lesson = { ...(query.lesson || {}), classId: student.classId };
    }
  } else if (role === "parent" && userId) {
    const kids = await prisma.student.findMany({
      where: { parentId: userId },
      select: { classId: true },
    });
    const classIds = kids.map((k) => k.classId);
    if (classIds.length) {
      query.lesson = { ...(query.lesson || {}), classId: { in: classIds } };
    }
  }

  const [exams, count, classes] = await prisma.$transaction([
    prisma.exam.findMany({
      where: query,
      include: {
        lesson: { include: { subject: true, class: true, teacher: true } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { startTime: sortOrder },
    }),
    prisma.exam.count({ where: query }),
    prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const renderRow = (item: any) => (
    <tr key={item.id} className="text-sm">
      <td>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-slate-900 truncate">
            {item.lesson?.subject?.name ?? "-"}
          </span>
          <span className="text-xs text-slate-500 truncate">{item.title}</span>
          <span className="text-xs text-slate-400 md:hidden mt-0.5 truncate">
            {item.lesson?.class?.name ?? "-"}
          </span>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.lesson?.class?.name ?? "-"}</td>
      <td className="hidden md:table-cell">
        {item.lesson?.teacher
          ? `${item.lesson.teacher.name} ${item.lesson.teacher.surname}`
          : "-"}
      </td>
      <td className="hidden lg:table-cell whitespace-nowrap tabular-nums text-slate-700">
        {formatDateTime(item.startTime)}
      </td>
      <td className="hidden lg:table-cell whitespace-nowrap tabular-nums text-slate-700">
        {formatDateTime(item.endTime)}
      </td>
      {(role === "admin" || role === "teacher") && (
        <td>
          <div className="flex items-center justify-end gap-2">
            <FormModal
              table="exam"
              type="update"
              data={JSON.parse(JSON.stringify(item))}
              id={item.id}
            />
            {role === "admin" && <FormModal table="exam" type="delete" id={item.id} />}
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <div className="m-4 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:m-6 md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-semibold text-slate-900">All Exams</h1>

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
              <FormModal table="exam" type="create" />
            )}
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        renderRow={renderRow}
        data={exams}
        emptyMessage="No exams found."
      />
      <Pagination page={p} count={count} />
    </div>
  );
}