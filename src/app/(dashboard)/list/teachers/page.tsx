import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormModal from "@/components/FormModal";
import FilterButton from "@/components/FilterButton";
import SortButton from "@/components/SortButton";
import ClearFiltersButton from "@/components/ClearFiltersButton";

import Image from "next/image";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import type { TeacherWithRelations } from "@/types";
import { Column } from "@/components/Table";
import UserRowActions from "@/components/Userrowactions";

const ITEM_PER_PAGE = 10;

export default async function TeachersListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { role } = await getAuthUser();

  const columns: Column[] = [
    { header: "Info", accessor: "info" },
    { header: "Teacher ID", accessor: "teacherId", className: "hidden md:table-cell" },
    { header: "Subjects", accessor: "subjects", className: "hidden lg:table-cell" },
    { header: "Classes", accessor: "classes", className: "hidden xl:table-cell" },
    ...(role === "admin"
      ? [
          { header: "Phone", accessor: "phone", className: "hidden md:table-cell" },
          { header: "Address", accessor: "address", className: "hidden lg:table-cell" },
          { header: "Actions", accessor: "action", align: "right" as const },
        ]
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
        query.lessons = { some: { classId: parseInt(value) } };
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

  const [teachers, count, classes] = await prisma.$transaction([
    prisma.teacher.findMany({
      where: query,
      include: {
        subjects: true,
        classes: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { name: sortOrder },
    }),
    prisma.teacher.count({ where: query }),
    prisma.class.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const renderRow = (item: TeacherWithRelations) => (
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
            {role === "admin" && (
              <span className="truncate text-xs text-slate-500">{item.email || "-"}</span>
            )}
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.username || item.id}</td>
      <td className="hidden lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {item.subjects.map((s) => (
            <span
              key={s.id}
              className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20"
            >
              {s.name}
            </span>
          ))}
          {item.subjects.length === 0 && <span className="text-xs text-slate-400">-</span>}
        </div>
      </td>
      <td className="hidden xl:table-cell">
        <div className="flex flex-wrap gap-1">
          {item.classes.map((c) => (
            <span
              key={c.id}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
            >
              {c.name}
            </span>
          ))}
          {item.classes.length === 0 && <span className="text-xs text-slate-400">-</span>}
        </div>
      </td>

      {role === "admin" && (
        <>
          <td className="hidden whitespace-nowrap tabular-nums md:table-cell">
            {item.phone || "-"}
          </td>
          <td className="hidden max-w-[200px] lg:table-cell">
            <span className="block truncate">{item.address}</span>
          </td>
          <td>
            {/* View + Reset password + Edit + Delete, sab ek component mein */}
            <UserRowActions table="teacher" item={item} />
          </td>
        </>
      )}
    </tr>
  );

  return (
    <div className="m-4 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:m-6 md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-semibold text-slate-900">All Teachers</h1>

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
            {role === "admin" && <FormModal table="teacher" type="create" />}
          </div>
        </div>
      </div>

      <Table columns={columns} renderRow={renderRow} data={teachers} emptyMessage="No teachers found." />
      <Pagination page={p} count={count} />
    </div>
  );
}