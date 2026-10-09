import { getAuthUser } from "@/lib/getRole";
import { getStudentsForFee } from "@/lib/actions/fee";
import { redirect } from "next/navigation";
import FeeClient from "@/components/FeeClient";

export default async function FeesPage() {
  const { role } = await getAuthUser();

  // Sirf admin fees collect kar sakta hai
  if (role !== "admin") {
    redirect("/");
  }

  const students = await getStudentsForFee();

  return (
    <div className="m-4 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:m-6 md:p-6">
      <div className="mb-8 border-b border-slate-100 pb-6">
        <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-slate-900">
          Fee Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Collect student fees and generate printable receipts instantly.
        </p>
      </div>

      <FeeClient students={students} />
    </div>
  );
}