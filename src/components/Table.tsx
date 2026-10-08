import React from "react";

export type Column = {
  header: string;
  accessor: string;
  className?: string;
  align?: "left" | "center" | "right";
};

type TableProps<T> = {
  columns: Column[];
  renderRow: (item: T) => React.ReactNode;
  data: T[];
  emptyMessage?: string;
};

export default function Table<T>({
  columns,
  renderRow,
  data,
  emptyMessage = "No records found.",
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[700px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((col) => {
              const alignClass =
                col.align === "center"
                  ? "text-center"
                  : col.align === "right"
                  ? "text-right"
                  : "text-left";

              return (
                <th
                  key={col.accessor}
                  scope="col"
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 ${alignClass} ${
                    col.className ?? ""
                  }`}
                >
                  {col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        {/* Changed py-3.5 to py-2.5 to reduce row height/space */}
        <tbody className="divide-y divide-slate-100 bg-white [&_td]:px-4 [&_td]:py-2.5 [&_td]:align-middle [&_td]:text-slate-700 [&_tr]:transition-colors [&_tr:hover]:bg-slate-50">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="!py-10 text-center text-sm text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => renderRow(item))
          )}
        </tbody>
      </table>
    </div>
  );
}