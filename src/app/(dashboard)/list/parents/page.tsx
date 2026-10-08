import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormModal from "@/components/FormModal";
import ViewButton from "@/components/ViewButton";
import SortButton from "@/components/SortButton";
import ClearFiltersButton from "@/components/ClearFiltersButton";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import { Parent, Student } from "@prisma/client";

type ParentListType = Parent & { students: Student[] };
const ITEM_PER_PAGE = 10;

export default async function ParentsListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { role } = await getAuthUser();

  const columns = [
    { header: "Parent Details", accessor: "info" },
    {
      header: "Students (Children)",
      accessor: "students",
      className: "hidden md:table-cell",
    },
    {
      header: "Phone",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Address",
      accessor: "address",
      className: "hidden lg:table-cell",
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
        query.OR = [
          { name: { contains: value, mode: "insensitive" } },
          { surname: { contains: value, mode: "insensitive" } },
          { username: { contains: value, mode: "insensitive" } },
          { phone: { contains: value, mode: "insensitive" } },
        ];
        break;
      default:
        break;
    }
  }

  const [parents, count] = await prisma.$transaction([
    prisma.parent.findMany({
      where: query,
      include: {
        students: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { name: sortOrder },
    }),
    prisma.parent.count({ where: query }),
  ]);

  const renderRow = (item: ParentListType) => {
    const serializedItem = JSON.parse(JSON.stringify(item));

    return (
      <tr key={item.id} className="text-sm">
        <td>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-900 truncate">
              {item.name} {item.surname}
            </span>
            <span className="text-xs text-slate-500 truncate">{item.email || "-"}</span>
          </div>
        </td>

        <td className="hidden md:table-cell">
          <div className="flex flex-wrap gap-1.5">
            {item.students?.map((student) => (
              <span
                key={student.id}
                className="inline-flex items-center rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20"
              >
                {student.name} {student.surname}
              </span>
            ))}
            {(!item.students || item.students.length === 0) && (
              <span className="text-xs text-slate-400">No students linked</span>
            )}
          </div>
        </td>

        <td className="hidden lg:table-cell whitespace-nowrap tabular-nums">{item.phone || "-"}</td>

        <td className="hidden lg:table-cell max-w-[200px]">
          <span className="block truncate">{item.address || "-"}</span>
        </td>

        {role === "admin" && (
          <td>
            <div className="flex items-center justify-end gap-2">
              <ViewButton href={`/list/parents/${item.id}`} />
              <FormModal
                table="parent"
                type="update"
                data={serializedItem}
                id={item.id}
              />
              <FormModal table="parent" type="delete" id={item.id} />
            </div>
          </td>
        )}
      </tr>
    );
  };

  return (
    <div className="m-4 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:m-6 md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">All Parents</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage parent directory and linked student accounts.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <TableSearch />
          <div className="flex items-center gap-2 self-end md:self-auto">
            <SortButton />
            <ClearFiltersButton />
            {role === "admin" && <FormModal table="parent" type="create" />}
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        renderRow={renderRow}
        data={parents}
        emptyMessage="No parents found."
      />
      <Pagination page={p} count={count} />
    </div>
  );
}