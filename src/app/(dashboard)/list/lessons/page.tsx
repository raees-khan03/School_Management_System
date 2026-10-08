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

const formatTime = (value: Date | string) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};

const toTitleCase = (s?: string) =>
  s ? s.charAt(0) + s.slice(1).toLowerCase() : "-";

export default async function LessonsListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { role, userId } = await getAuthUser();

  const columns = [
    { header: "Subject", accessor: "name" },
    { header: "Class", accessor: "class" },
    { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
    { header: "Day", accessor: "day", className: "hidden lg:table-cell" },
    { header: "Time", accessor: "time", className: "hidden lg:table-cell" },
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
          { name: { contains: value, mode: "insensitive" } },
          { subject: { name: { contains: value, mode: "insensitive" } } },
        ];
        break;
      case "classId":
        query.classId = parseInt(value);
        break;
      case "teacherId":
        query.teacherId = value;
        break;
      default:
        break;
    }
  }

  if (role === "teacher" && userId) {
    query.teacherId = userId;
  }

  const [lessons, count, classes] = await prisma.$transaction([
    prisma.lesson.findMany({
      where: query,
      include: { subject: true, class: true, teacher: true },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { name: sortOrder },
    }),
    prisma.lesson.count({ where: query }),
    prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const renderRow = (item: any) => (
    <tr key={item.id} className="text-sm">
      <td className="font-semibold text-slate-900">
        {item.subject?.name || item.name}
      </td>
      <td className="font-medium">{item.class?.name ?? "-"}</td>
      <td className="hidden md:table-cell">
        {item.teacher
          ? `${item.teacher.name} ${item.teacher.surname}`
          : "-"}
      </td>
      <td className="hidden lg:table-cell">{toTitleCase(item.day)}</td>
      <td className="hidden lg:table-cell whitespace-nowrap">
        <span className="inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/20 tabular-nums">
          {formatTime(item.startTime)} – {formatTime(item.endTime)}
        </span>
      </td>
      {(role === "admin" || role === "teacher") && (
        <td>
          <div className="flex items-center justify-end gap-2">
            <FormModal
              table="lesson"
              type="update"
              data={JSON.parse(JSON.stringify(item))}
              id={item.id}
            />
            {role === "admin" && <FormModal table="lesson" type="delete" id={item.id} />}
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <div className="m-4 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:m-6 md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-semibold text-slate-900">All Lessons</h1>

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
              <FormModal table="lesson" type="create" />
            )}
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        renderRow={renderRow}
        data={lessons}
        emptyMessage="No lessons found."
      />
      <Pagination page={p} count={count} />
    </div>
  );
}