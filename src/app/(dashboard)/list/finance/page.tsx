import { getAuthUser } from "@/lib/getRole";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormModal from "@/components/FormModal";
import FilterButton from "@/components/FilterButton";
import SortButton from "@/components/SortButton";
import ClearFiltersButton from "@/components/ClearFiltersButton";

const ITEM_PER_PAGE = 10;

const formatDate = (dateInput: Date | string) => {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateInput));
};

// 1. Updated Currency Formatter to PKR
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0, // Removes .00 if not needed
  }).format(amount);
};

export default async function FinanceListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { role } = await getAuthUser();

  if (role !== "admin") {
    redirect("/"); 
  }

  const columns = [
    { header: "Transaction", accessor: "title" },
    { header: "Category", accessor: "category", className: "hidden md:table-cell" },
    { header: "Date", accessor: "date", className: "hidden sm:table-cell" },
    { header: "Amount", accessor: "amount", align: "right" as const },
    { header: "Actions", accessor: "action", align: "right" as const },
  ];

  const { page, sort, ...queryParams } = searchParams;
  const p = page ? Math.max(1, parseInt(page) || 1) : 1;
  const sortOrder = sort === "asc" ? "asc" : "desc"; 

  const query: any = {};

  if (queryParams.search) {
    query.OR = [
      { title: { contains: queryParams.search, mode: "insensitive" } },
      { category: { contains: queryParams.search, mode: "insensitive" } },
    ];
  }
  if (queryParams.type) {
    query.type = queryParams.type; 
  }

  const [transactions, count] = await prisma.$transaction([
    prisma.transaction.findMany({
      where: query,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { date: sortOrder },
    }),
    prisma.transaction.count({ where: query }),
  ]);

  const renderRow = (item: any) => {
    const isIncome = item.type === "INCOME";

    return (
      <tr key={item.id} className="text-sm border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
        <td className="px-4 py-3.5 align-middle">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                isIncome ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              }`}
            >
              {isIncome ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-slate-900 truncate">{item.title}</span>
              <span className="text-xs text-slate-500 truncate md:hidden">
                {item.category} • {formatDate(item.date)}
              </span>
            </div>
          </div>
        </td>
        <td className="hidden md:table-cell px-4 py-3.5 align-middle">
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            {item.category}
          </span>
        </td>
        <td className="hidden sm:table-cell px-4 py-3.5 align-middle text-slate-600 tabular-nums">
          {formatDate(item.date)}
        </td>
        <td className="px-4 py-3.5 align-middle text-right tabular-nums font-bold">
          {/* 2. Using formatCurrency here */}
          <span className={isIncome ? "text-emerald-600" : "text-slate-900"}>
            {isIncome ? "+" : "-"}{formatCurrency(item.amount)}
          </span>
        </td>
        <td className="px-4 py-3.5 align-middle text-right">
          <div className="inline-flex items-center justify-end gap-2">
            <FormModal table="finance" type="update" data={JSON.parse(JSON.stringify(item))} id={item.id} />
            <FormModal table="finance" type="delete" id={item.id} />
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="m-4 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:m-6 md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-slate-900">
            Financial Ledger
          </h1>
          <p className="mt-1 text-sm text-slate-500">Track institutional income and expenses in Rs.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <TableSearch />
          <div className="flex items-center gap-2 shrink-0">
            <FilterButton
              param="type"
              label="Type"
              options={[
                { label: "Income", value: "INCOME" },
                { label: "Expense", value: "EXPENSE" },
              ]}
            />
            <SortButton />
            <ClearFiltersButton />
            <FormModal table="finance" type="create" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <Table columns={columns} renderRow={renderRow} data={transactions} emptyMessage="No transactions found." />
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/40">
          <Pagination page={p} count={count} />
        </div>
      </div>
    </div>
  );
}