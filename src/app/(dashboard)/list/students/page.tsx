import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormModal from "@/components/FormModal";

import Image from "next/image";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import type { StudentWithRelations } from "@/types";

import FilterButton from "@/components/FilterButton";
import SortButton from "@/components/SortButton";
import ViewButton from "@/components/ViewButton";

const ITEM_PER_PAGE = 10;

export default async function StudentsListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { role, userId } = await getAuthUser();

  const columns = [
    { header: "Info", accessor: "info" },
    { header: "Student ID", accessor: "studentId", className: "hidden md:table-cell" },
    { header: "Grade", accessor: "grade", className: "hidden md:table-cell" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Phone", accessor: "phone", className: "hidden lg:table-cell" },
    { header: "Address", accessor: "address", className: "hidden lg:table-cell" },
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
      case "classId":
        query.classId = parseInt(value);
        break;
      case "search":
        query.OR = [
          { name: { contains: value, mode: "insensitive" } },
          { surname: { contains: value, mode: "insensitive" } },
          { username: { contains: value, mode: "insensitive" } },
        ];
        break;
      default:
        break;
    }
  }

  // Role based access
  if (role === "teacher" && userId) {
    query.class = {
      OR: [{ supervisorId: userId }, { lessons: { some: { teacherId: userId } } }],
    };
  } else if (role === "parent" && userId) {
    query.parentId = userId;
  } else if (role === "student" && userId) {
    query.id = userId;
  }

  const [students, count, classes] = await prisma.$transaction([
    prisma.student.findMany({
      where: query,
      include: { class: true, grade: true },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { name: sortOrder },
    }),
    prisma.student.count({ where: query }),
    prisma.class.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const renderRow = (item: StudentWithRelations) => (
    <tr key={item.id} className="text-sm">
      <td>
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src={item.img || "/noAvatar.png"}
            alt={`${item.name} ${item.surname}`}
            width={36}
            height={36}
            unoptimized
            className="h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover"
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-slate-900">
              {item.name} {item.surname}
            </span>
            <span className="truncate text-xs text-slate-500 md:hidden">
              {item.class?.name ?? "-"}
            </span>
          </div>
        </div>
      </td>

      <td className="hidden md:table-cell">{item.username || item.id}</td>
      <td className="hidden tabular-nums md:table-cell">{item.grade?.level ?? "-"}</td>
      <td className="hidden font-medium md:table-cell">{item.class?.name ?? "-"}</td>
      <td className="hidden whitespace-nowrap tabular-nums lg:table-cell">{item.phone || "-"}</td>
      <td className="hidden max-w-[220px] lg:table-cell">
        <span className="block truncate">{item.address || "-"}</span>
      </td>

      {role === "admin" && (
        <td>
          <div className="flex items-center justify-end gap-2">
            <ViewButton href={`/list/students/${item.id}`} />
            <FormModal table="student" type="update" data={item} id={item.id} />
            <FormModal table="student" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <div className="m-4  flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-semibold text-slate-900">All Students</h1>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <TableSearch />
          <div className="flex items-center gap-2 self-end md:self-auto">
            <FilterButton
              param="classId"
              label="Class"
              options={classes.map((c) => ({ label: c.name, value: String(c.id) }))}
            />
            <SortButton />
            {role === "admin" && <FormModal table="student" type="create" />}
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        renderRow={renderRow}
        data={students}
        emptyMessage="No students found."
      />
      <Pagination page={p} count={count} />
    </div>
  );
}