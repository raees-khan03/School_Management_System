import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormModal from "@/components/FormModal";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";

const ITEM_PER_PAGE = 10;

const ResultsListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { role, userId } = await getAuthUser();

  const columns = [
    { header: "Student", accessor: "student" },
    { header: "Score", accessor: "score" },
    { header: "Type", accessor: "type", className: "hidden md:table-cell" },
    ...(role === "admin" || role === "teacher"
      ? [{ header: "Actions", accessor: "action" }]
      : []),
  ];

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: any = {};

  if (queryParams.search) {
    query.OR = [
      { student: { name: { contains: queryParams.search, mode: "insensitive" } } },
      { student: { surname: { contains: queryParams.search, mode: "insensitive" } } },
    ];
  }
  if (queryParams.studentId) {
    query.studentId = queryParams.studentId;
  }

  // ===== ROLE-BASED FILTER =====
  if (role === "parent" && userId) {
    // Sirf apne bacchon ke results
    query.student = { parentId: userId };
  } else if (role === "student" && userId) {
    query.studentId = userId;
  } else if (role === "teacher" && userId) {
    query.OR = [
      { exam: { lesson: { teacherId: userId } } },
      { assignment: { lesson: { teacherId: userId } } },
    ];
  }
  // admin: no extra filter

  const [results, count] = await prisma.$transaction([
    prisma.result.findMany({
      where: query,
      include: {
        student: true,
        exam: { include: { lesson: { include: { subject: true } } } },
        assignment: { include: { lesson: { include: { subject: true } } } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { id: "desc" },
    }),
    prisma.result.count({ where: query }),
  ]);

  const renderRow = (item: any) => {
    const subjectName =
      item.exam?.lesson?.subject?.name ||
      item.assignment?.lesson?.subject?.name ||
      "-";
    const typeLabel = item.examId ? "Exam" : item.assignmentId ? "Assignment" : "-";

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">
          <div className="flex flex-col">
            <span className="font-semibold">
              {item.student?.name} {item.student?.surname}
            </span>
            <span className="text-xs text-gray-400">{subjectName}</span>
          </div>
        </td>
        <td className="font-medium">{item.score}</td>
        <td className="hidden md:table-cell">{typeLabel}</td>
        {(role === "admin" || role === "teacher") && (
          <td>
            <div className="flex items-center gap-2">
              <FormModal table="result" type="update" data={JSON.parse(JSON.stringify(item))} id={item.id} />
              {role === "admin" && (
                <FormModal table="result" type="delete" id={item.id} />
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
        <h1 className="hidden md:block text-lg font-semibold">
          {role === "parent" ? "My Children's Results" : "All Results"}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            {(role === "admin" || role === "teacher") && (
              <FormModal table="result" type="create" />
            )}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={results} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ResultsListPage;