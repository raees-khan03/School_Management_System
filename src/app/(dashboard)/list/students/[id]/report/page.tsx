import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import PrintButton from "@/components/PrintButton";
import { Building2 } from "lucide-react";

// Helper: Calculate Grade based on percentage
const getGrade = (percentage: number) => {
  if (percentage >= 90) return { grade: "A+", remarks: "Excellent" };
  if (percentage >= 80) return { grade: "A", remarks: "Very Good" };
  if (percentage >= 70) return { grade: "B", remarks: "Good" };
  if (percentage >= 60) return { grade: "C", remarks: "Satisfactory" };
  if (percentage >= 50) return { grade: "D", remarks: "Pass" };
  return { grade: "F", remarks: "Needs Improvement" };
};

export default async function StudentReportCardPage({
  params,
}: {
  params: { id: string };
}) {
  const { role, userId } = await getAuthUser();

  // 1. Fetch Student with Results and Class details
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      class: true,
      grade: true,
      results: {
        include: {
          exam: { include: { lesson: { include: { subject: true } } } },
          assignment: { include: { lesson: { include: { subject: true } } } },
        },
      },
    },
  });

  if (!student) return notFound();

  // 2. Security Check (Admin, Teacher, Student themselves, or their Parent)
  if (role === "student" && userId !== student.id) redirect("/");
  if (role === "parent" && userId !== student.parentId) redirect("/");

  // 3. Process Data: Group scores by Subject
  const subjectMap: Record<string, { totalScore: number; count: number }> = {};

  student.results.forEach((result) => {
    const subjectName =
      result.exam?.lesson?.subject?.name ||
      result.assignment?.lesson?.subject?.name;

    if (subjectName) {
      if (!subjectMap[subjectName]) {
        subjectMap[subjectName] = { totalScore: 0, count: 0 };
      }
      subjectMap[subjectName].totalScore += result.score;
      subjectMap[subjectName].count += 1;
    }
  });

  let grandTotalObtained = 0;
  let grandTotalMax = 0;

  const subjectResults = Object.keys(subjectMap).map((subject) => {
    const avgScore = Math.round(
      subjectMap[subject].totalScore / subjectMap[subject].count
    );
    grandTotalObtained += avgScore;
    grandTotalMax += 100;

    return {
      subject,
      score: avgScore,
      ...getGrade(avgScore),
    };
  });

  const overallPercentage =
    grandTotalMax > 0 ? Math.round((grandTotalObtained / grandTotalMax) * 100) : 0;
  const overallGrade = getGrade(overallPercentage);

  return (
    <div className="w-full p-4 md:p-6 bg-slate-50 min-h-screen">
      
      {/* CSS PRINT STYLES - ISOLATES ONLY THE REPORT CARD FOR PDF */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide everything in the dashboard shell (sidebar, navbar, header) */
          body * {
            visibility: hidden !important;
          }
          /* Show ONLY the Report Card Container */
          #printable-report-card, #printable-report-card * {
            visibility: visible !important;
          }
          #printable-report-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* Top Action Bar (Screen Only - Hidden in PDF) */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-slate-900">
            Student Report Card
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and download academic performance transcript.
          </p>
        </div>
        <PrintButton />
      </div>

      {/* ===================== PRINTABLE A4 AREA ===================== */}
      <div
        id="printable-report-card"
        className="mx-auto max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200"
      >
        {/* REPORT HEADER */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">
                CampusPulse Academy
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Official Academic Transcript • Session 2025/2026
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date Issued</p>
            <p className="text-sm font-semibold text-slate-900 tabular-nums">
              {new Intl.DateTimeFormat("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(new Date())}
            </p>
          </div>
        </div>

        {/* STUDENT INFO GRID */}
        <div className="flex items-center justify-between mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 rounded-full border-2 border-slate-200 bg-white overflow-hidden shrink-0">
              <Image
                src={student.img || "/noAvatar.png"}
                alt={student.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">
                {student.name} {student.surname}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Student ID: <span className="text-slate-900 font-mono">{student.username}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 text-right">
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider">Class</span>
              <span className="font-bold text-slate-900 text-base">{student.class?.name || "-"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider">Grade</span>
              <span className="font-bold text-slate-900 text-base">{student.grade?.level || "-"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider">DOB</span>
              <span className="font-semibold text-slate-900 text-sm tabular-nums">
                {new Intl.DateTimeFormat("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(new Date(student.birthday))}
              </span>
            </div>
          </div>
        </div>

        {/* MARKS TABLE */}
        <div className="mb-8">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Academic Marks Breakdown
          </h4>
          {subjectResults.length > 0 ? (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-100">
                  <th className="py-3 px-4 font-semibold text-slate-700">Subject</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 text-center">Max Marks</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 text-center">Obtained</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 text-center">Grade</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border-b-2 border-slate-200">
                {subjectResults.map((sub, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4 font-semibold text-slate-900">{sub.subject}</td>
                    <td className="py-3 px-4 text-center tabular-nums text-slate-600">100</td>
                    <td className="py-3 px-4 text-center tabular-nums font-bold text-slate-900">{sub.score}</td>
                    <td className="py-3 px-4 text-center font-bold text-teal-700">{sub.grade}</td>
                    <td className="py-3 px-4 text-right text-slate-500 italic">{sub.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
              <p className="text-sm text-slate-500">No examination or assignment records found for this student.</p>
            </div>
          )}
        </div>

        {/* SUMMARY SECTION */}
        {subjectResults.length > 0 && (
          <div className="flex justify-end mb-12">
            <div className="w-full sm:w-1/2 rounded-xl border border-slate-200 p-5 bg-slate-50">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">
                Overall Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Marks</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{grandTotalObtained} / {grandTotalMax}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Percentage</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{overallPercentage}%</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-2">
                  <span className="text-sm font-bold text-slate-900">Final Grade</span>
                  <span className="text-2xl font-black text-teal-700">{overallGrade.grade}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OFFICIAL SIGNATURES */}
        <div className="mt-16 grid grid-cols-2 gap-8 text-center pt-8 border-t border-slate-100">
          <div>
            <div className="mx-auto w-48 border-b border-slate-400 mb-2"></div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class Teacher Signature</p>
          </div>
          <div>
            <div className="mx-auto w-48 border-b border-slate-400 mb-2"></div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Principal Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}