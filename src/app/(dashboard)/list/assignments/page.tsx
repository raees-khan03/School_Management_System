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

const formatDate = (v: Date | string) => {
  const d = new Date(v);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
};

export default async function AnnouncementsListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { role, userId } = await getAuthUser();

  const columns = [
    { header: "Title", accessor: "title" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Date", accessor: "date", className: "hidden md:table-cell" },
    ...(role === "admin"
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
        query.title = { contains: value, mode: "insensitive" };
        break;
      case "classId":
        query.classId = parseInt(value);
        break;
      default:
        break;
    }
  }

  // Role-based visibility
  if (role !== "admin" && userId) {
    if (role === "teacher") {
      query.OR = [
        { classId: null },
        {
          class: {
            OR: [
              { lessons: { some: { teacherId: userId } } },
              { supervisorId: userId },
            ],
          },
        },
      ];
    } else if (role === "student") {
      query.OR = [{ classId: null }, { class: { students: { some: { id: userId } } } }];
    } else if (role === "parent") {
      query.OR = [{ classId: null }, { class: { students: { some: { parentId: userId } } } }];
    }
  }

  const [announcements, count, classes] = await prisma.$transaction([
    prisma.announcement.findMany({
      where: query,
      include: { class: true },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { date: sortOrder },
    }),
    prisma.announcement.count({ where: query }),
    prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const renderRow = (item: any) => (
    <tr key={item.id} className="text-sm">
      <td>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-slate-900 truncate">{item.title}</span>
          <span className="text-xs text-slate-500 truncate">{item.description}</span>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {item.class?.name ? (
          <span className="inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/20">
            {item.class.name}
          </span>
        ) : (
          <span className="text-xs text-slate-400">All classes</span>
        )}
      </td>
      <td className="hidden md:table-cell whitespace-nowrap tabular-nums">
        {formatDate(item.date)}
      </td>
      {role === "admin" && (
        <td>
          <div className="flex items-center justify-end gap-2">
            <FormModal
              table="announcement"
              type="update"
              data={JSON.parse(JSON.stringify(item))}
              id={item.id}
            />
            <FormModal table="announcement" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <div className="m-4 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:m-6 md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-semibold text-slate-900">All Announcements</h1>

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
            {role === "admin" && <FormModal table="announcement" type="create" />}
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        renderRow={renderRow}
        data={announcements}
        emptyMessage="No announcements found."
      />
      <Pagination page={p} count={count} />
    </div>
  );
}