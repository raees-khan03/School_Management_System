import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormModal from "@/components/FormModal";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import type { SubjectWithRelations } from "@/types";

const ITEM_PER_PAGE = 10;

const SubjectsListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { role } = await getAuthUser();

  const columns = [
    { header: "Subject Name", accessor: "name" },
    {
      header: "Teachers",
      accessor: "teachers",
      className: "hidden md:table-cell",
    },
    ...(role === "admin" ? [{ header: "Actions", accessor: "action" }] : []),
  ];

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: any = {};
  if (queryParams?.search) {
    query.name = { contains: queryParams.search, mode: "insensitive" };
  }

  const [subjects, count] = await prisma.$transaction([
    prisma.subject.findMany({
      where: query,
      include: { teachers: true },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { name: "asc" },
    }),
    prisma.subject.count({ where: query }),
  ]);

  const renderRow = (item: SubjectWithRelations) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <h3 className="font-semibold">{item.name}</h3>
      </td>
      <td className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {item.teachers.map((t) => (
            <span
              key={t.id}
              className="bg-indigo-50 text-indigo-700 text-[11px] font-medium px-2 py-0.5 rounded-full"
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
          <div className="flex items-center gap-2">
            <FormModal table="subject" type="update" data={item} id={item.id} />
            <FormModal table="subject" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <div className="bg-white m-4 mt-0 rounded-md flex-1 h-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Subjects</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 rounded-full flex items-center justify-center bg-lamaYellow">
              <Image src="/filter.png" height={14} width={14} alt="filter" />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center bg-lamaYellow">
              <Image src="/sort.png" height={14} width={14} alt="sort" />
            </button>
            {role === "admin" && <FormModal table="subject" type="create" />}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={subjects} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default SubjectsListPage;