import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormModal from "@/components/FormModal";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import { Parent, Student } from "@prisma/client";

type ParentListType = Parent & { students: Student[] };

const ITEM_PER_PAGE = 10;

const ParentsListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  // ===== 1. Get Authenticated User Role =====
  const { role } = await getAuthUser();

  // ===== 2. Dynamic Columns =====
  const columns = [
    { header: "Info", accessor: "info" },
    {
      header: "Student Names",
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
    ...(role === "admin" ? [{ header: "Actions", accessor: "action" }] : []),
  ];

  // ===== 3. Pagination & Query Setup =====
  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: any = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
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
    }
  }

  // ===== 4. Prisma Neon DB Query =====
  const [parents, count] = await prisma.$transaction([
    prisma.parent.findMany({
      where: query,
      include: {
        students: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { name: "asc" },
    }),
    prisma.parent.count({ where: query }),
  ]);

  // ===== 5. Table Row Render =====
  const renderRow = (item: ParentListType) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight transition-colors"
    >
      {/* Name & Email Info */}
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold text-slate-800">
            {item.name} {item.surname}
          </h3>
          <p className="text-xs text-slate-500">{item.email || "-"} </p>
        </div>
      </td>

      {/* Children/Student Names */}
      <td className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {item.students.map((student) => (
            <span
              key={student.id}
              className="bg-indigo-50 text-indigo-700 text-[11px] font-medium px-2 py-0.5 rounded-full"
            >
              {student.name} {student.surname}
            </span>
          ))}
          {item.students.length === 0 && (
            <span className="text-xs text-slate-400">No students</span>
          )}
        </div>
      </td>

      {/* Phone */}
      <td className="hidden lg:table-cell text-slate-600">{item.phone}</td>

      {/* Address */}
      <td className="hidden lg:table-cell text-slate-600">{item.address}</td>

      {/* Actions (Sirf Admin ke liye) */}
      {role === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <Link href={`/list/parents/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky hover:bg-sky-200 transition-colors">
                <Image src="/view.png" alt="view" width={16} height={16} />
              </button>
            </Link>
            <FormModal table="parent" type="update" data={item} id={item.id} />
            <FormModal table="parent" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <div className="bg-white m-4 mt-0 rounded-md flex-1 h-full p-4">
      {/* TOP HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold text-slate-800">
          All Parents
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 rounded-full flex items-center justify-center bg-lamaYellow hover:opacity-80 transition-opacity">
              <Image src="/filter.png" height={14} width={14} alt="filter" />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center bg-lamaYellow hover:opacity-80 transition-opacity">
              <Image src="/sort.png" height={14} width={14} alt="sort" />
            </button>
            {/* Sirf Admin create kar sakta hai */}
            {role === "admin" && <FormModal table="parent" type="create" />}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <Table columns={columns} renderRow={renderRow} data={parents} />

      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ParentsListPage;