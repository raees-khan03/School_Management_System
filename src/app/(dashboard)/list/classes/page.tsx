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

export default async function ClassesListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { role } = await getAuthUser();

  const columns = [
    { header: "Class", accessor: "name" },
    { header: "Capacity", accessor: "capacity" },
    { header: "Grade", accessor: "grade", className: "hidden md:table-cell" },
    { header: "Supervisor", accessor: "supervisor", className: "hidden md:table-cell" },
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
      case "gradeId":
        query.gradeId = parseInt(value);
        break;
      case "supervisorId":
        query.supervisorId = value;
        break;
      default:
        break;
    }
  }

  const [classes, count, grades] = await prisma.$transaction([
    prisma.class.findMany({
      where: query,
      include: { grade: true, supervisor: true },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { name: sortOrder },
    }),
    prisma.class.count({ where: query }),
    prisma.grade.findMany({ orderBy: { level: "asc" } }),
  ]);

  const renderRow = (item: any) => (
    <tr key={item.id} className="text-sm">
      <td className="font-semibold text-slate-900">{item.name}</td>
      <td className="tabular-nums">{item.capacity}</td>
      <td className="hidden md:table-cell tabular-nums">{item.grade?.level ?? "-"}</td>
      <td className="hidden md:table-cell">
        {item.supervisor
          ? `${item.supervisor.name} ${item.supervisor.surname}`
          : "-"}
      </td>
      {role === "admin" && (
        <td>
          <div className="flex items-center justify-end gap-2">
            <FormModal
              table="class"
              type="update"
              data={JSON.parse(JSON.stringify(item))}
              id={item.id}
            />
            <FormModal table="class" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <div className="m-4 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:m-6 md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-semibold text-slate-900">All Classes</h1>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <TableSearch />
          <div className="flex items-center gap-2 self-end md:self-auto">
            <FilterButton
              param="gradeId"
              label="Grade"
              options={grades.map((g) => ({
                label: `Grade ${g.level}`,
                value: String(g.id),
              }))}
            />
            <SortButton />
            <ClearFiltersButton />
            {role === "admin" && <FormModal table="class" type="create" />}
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        renderRow={renderRow}
        data={classes}
        emptyMessage="No classes found."
      />
      <Pagination page={p} count={count} />
    </div>
  );
}