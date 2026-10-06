import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormModal from "@/components/FormModal";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";

const ITEM_PER_PAGE = 10;

// Helper: Time ko 12-hour AM/PM format mein convert karne ke liye
const formatTime = (timeValue: Date | string) => {
  if (!timeValue) return "-";
  const date = new Date(timeValue);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Helper: Day ko Proper Case ("MONDAY" -> "Monday") mein convert karne ke liye
const formatDay = (dayStr: string) => {
  if (!dayStr) return "-";
  return dayStr.charAt(0) + dayStr.slice(1).toLowerCase();
};

const LessonsListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { role, userId } = await getAuthUser();

  const columns = [
    { header: "Subject Name", accessor: "name" },
    { header: "Class", accessor: "class" },
    { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
    { header: "Day", accessor: "day", className: "hidden lg:table-cell" },
    { header: "Time", accessor: "time", className: "hidden lg:table-cell" },
    ...(role === "admin" || role === "teacher"
      ? [{ header: "Actions", accessor: "action" }]
      : []),
  ];

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: any = {};
  if (queryParams.search) {
    query.OR = [
      { name: { contains: queryParams.search, mode: "insensitive" } },
      { subject: { name: { contains: queryParams.search, mode: "insensitive" } } },
    ];
  }
  if (queryParams.classId) query.classId = parseInt(queryParams.classId);
  if (queryParams.teacherId) query.teacherId = queryParams.teacherId;

  if (role === "teacher" && userId) {
    query.teacherId = userId;
  }

  const [lessons, count] = await prisma.$transaction([
    prisma.lesson.findMany({
      where: query,
      include: {
        subject: true,
        class: true,
        teacher: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { name: "asc" },
    }),
    prisma.lesson.count({ where: query }),
  ]);

  const renderRow = (item: any) => {
    // Safe serialization for FormModal
    const serializedItem = JSON.parse(JSON.stringify(item));

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4 font-semibold">{item.subject?.name || item.name}</td>
        <td>{item.class?.name}</td>
        <td className="hidden md:table-cell">
          {item.teacher ? `${item.teacher.name} ${item.teacher.surname}` : "-"}
        </td>
        
        {/* DAY COLUMN */}
        <td className="hidden lg:table-cell font-medium text-slate-600">
          {formatDay(item.day)}
        </td>

        {/* TIME COLUMN (START TIME - END TIME) */}
        <td className="hidden lg:table-cell font-medium text-slate-600">
          <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-semibold">
            {formatTime(item.startTime)} - {formatTime(item.endTime)}
          </span>
        </td>

        {(role === "admin" || role === "teacher") && (
          <td>
            <div className="flex items-center gap-2">
              <FormModal
                table="lesson"
                type="update"
                data={serializedItem}
                id={item.id}
              />
              {role === "admin" && (
                <FormModal table="lesson" type="delete" id={item.id} />
              )}
            </div>
          </td>
        )}
      </tr>
    );
  };

  return (
    <div className="bg-white m-4 mt-0 rounded-md flex-1 h-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Lessons</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 rounded-full flex items-center justify-center bg-lamaYellow">
              <Image src="/filter.png" height={14} width={14} alt="" />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center bg-lamaYellow">
              <Image src="/sort.png" height={14} width={14} alt="" />
            </button>
            {(role === "admin" || role === "teacher") && (
              <FormModal table="lesson" type="create" />
            )}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={lessons} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default LessonsListPage;