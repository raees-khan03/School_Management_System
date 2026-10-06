import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormModal from "@/components/FormModal";
import Image from "next/image";
import prisma from "@/lib/prisma";
import type { AnnouncementWithRelations } from "@/types";
import { getAuthUser } from "@/lib/getRole";

const ITEM_PER_PAGE = 10;

const AnnouncementsListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, role } = await getAuthUser();

  // ===== 1. Dynamic Columns (Sirf Admin ko Actions column dikhega) =====
  const columns = [
    { header: "Title", accessor: "title" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Date", accessor: "date", className: "hidden md:table-cell" },
    ...(role === "admin" ? [{ header: "Actions", accessor: "action" }] : []),
  ];

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: any = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.classId = parseInt(value);
            break;
          case "search":
            query.title = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  // ===== 2. Role-based Filters =====
  if (role && role !== "admin" && userId) {
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
      query.OR = [
        { classId: null },
        { class: { students: { some: { id: userId } } } },
      ];
    } else if (role === "parent") {
      query.OR = [
        { classId: null },
        { class: { students: { some: { parentId: userId } } } },
      ];
    }
  }

  const [announcements, count] = await prisma.$transaction([
    prisma.announcement.findMany({
      where: query,
      include: { class: true },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { date: "desc" },
    }),
    prisma.announcement.count({ where: query }),
  ]);

  // ===== 3. Table Row Render =====
  const renderRow = (item: AnnouncementWithRelations) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <h3 className="font-semibold">{item.title}</h3>
      </td>
      <td className="hidden md:table-cell">
        {item.class?.name || "All Classes"}
      </td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-GB").format(new Date(item.date))}
      </td>
      {/* ✅ Sirf Admin ke liye Action Column ka Cell (td) render hoga */}
      {role === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <FormModal
              table="announcement"
              type="edit"
              data={item}
              id={item.id}
            />
            <FormModal table="announcement" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <div className="bg-white m-4 mt-0 rounded-md flex-1 h-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          All Announcements
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 rounded-full flex items-center justify-center bg-lamaYellow">
              <Image src="/filter.png" height={14} width={14} alt="filter" />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center bg-lamaYellow">
              <Image src="/sort.png" height={14} width={14} alt="sort" />
            </button>
            {role === "admin" && (
              <FormModal table="announcement" type="create" />
            )}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={announcements} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AnnouncementsListPage;