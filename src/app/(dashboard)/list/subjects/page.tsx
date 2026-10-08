import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormModal from "@/components/FormModal";
import SortButton from "@/components/SortButton";
import ClearFiltersButton from "@/components/ClearFiltersButton";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";

const ITEM_PER_PAGE = 10;

export default async function SubjectsListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { role } = await getAuthUser();

  const columns = [
    { header: "Subject", accessor: "name" },
    {
      header: "Assigned teachers",
      accessor: "teachers",
      className: "hidden md:table-cell",
    },
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
        query.name = { contains: value, mode: "insensitive" };
        break;
      default:
        break;
    }
  }

  const [subjects, count] = await prisma.$transaction([
    prisma.subject.findMany({
      where: query,
      include: { teachers: true },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { name: sortOrder },
    }),
    prisma.subject.count({ where: query }),
  ]);

  const renderRow = (item: any) => (
    <tr key={item.id} className="text-sm">
      <td className="font-semibold text-slate-900">{item.name}</td>
      <td className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {item.teachers.map((t: any) => (
            <span
              key={t.id}
              className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20"
            >
              {t.name} {t.surname}
            </span>
          ))}
          {item.teachers.length === 0 && (
            <span className="text-xs text-slate-400">No teachers</span>
          )}
        </div>
      </td>
      {role === "admin" && (
        <td>
          <div className="flex items-center justify-end gap-2">
            <FormModal
              table="subject"
              type="update"
              data={JSON.parse(JSON.stringify(item))}
              id={item.id}
            />
            <FormModal table="subject" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <div className="m-4 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:m-6 md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-semibold text-slate-900">All Subjects</h1>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <TableSearch />
          <div className="flex items-center gap-2 self-end md:self-auto">
            <SortButton />
            <ClearFiltersButton />
            {role === "admin" && <FormModal table="subject" type="create" />}
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        renderRow={renderRow}
        data={subjects}
        emptyMessage="No subjects found."
      />
      <Pagination page={p} count={count} />
    </div>
  );
}