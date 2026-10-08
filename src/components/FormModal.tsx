"use client";

import { useEffect, useState, type ReactElement } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, TriangleAlert } from "lucide-react";

// Server Actions Imports
import { deleteTeacher } from "@/lib/actions/teacher";
import { deleteStudent } from "@/lib/actions/student";
import { deleteParent } from "@/lib/actions/parent";
import { deleteSubject } from "@/lib/actions/subject";
import { deleteClass } from "@/lib/actions/class";
import { deleteLesson } from "@/lib/actions/lesson";
import { deleteExam } from "@/lib/actions/exam";
import { deleteAssignment } from "@/lib/actions/assignment";
import { deleteResult } from "@/lib/actions/result";
import { deleteEvent } from "@/lib/actions/event";
import { deleteAnnouncement } from "@/lib/actions/announcement";
import { deleteAttendance } from "@/lib/actions/attendance";

const Loading = () => <p className="p-4 text-center text-sm text-slate-500">Loading form...</p>;

// Dynamic Form Imports
const TeacherForm = dynamic(() => import("./forms/TeacherForm"), { loading: Loading, ssr: false });
const StudentForm = dynamic(() => import("./forms/StudentForm"), { loading: Loading, ssr: false });
const ParentForm = dynamic(() => import("./forms/ParentForm"), { loading: Loading, ssr: false });
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), { loading: Loading, ssr: false });
const ClassForm = dynamic(() => import("./forms/ClassForm"), { loading: Loading, ssr: false });
const LessonForm = dynamic(() => import("./forms/LessonForm"), { loading: Loading, ssr: false });
const ExamForm = dynamic(() => import("./forms/ExamForm"), { loading: Loading, ssr: false });
const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"), { loading: Loading, ssr: false });
const ResultForm = dynamic(() => import("./forms/ResultForm"), { loading: Loading, ssr: false });
const EventForm = dynamic(() => import("./forms/EventForm"), { loading: Loading, ssr: false });
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"), { loading: Loading, ssr: false });
const AttendanceForm = dynamic(() => import("./forms/AttendanceForm"), { loading: Loading, ssr: false });

export type TableType =
  | "teacher"
  | "student"
  | "parent"
  | "subject"
  | "class"
  | "lesson"
  | "exam"
  | "assignment"
  | "result"
  | "event"
  | "announcement"
  | "attendance";

type DeleteResult = { success: boolean; error?: string };

const deleteActionMap: Record<TableType, (id: string) => Promise<DeleteResult>> = {
  teacher: deleteTeacher as any,
  student: deleteStudent as any,
  parent: deleteParent as any,
  subject: deleteSubject as any,
  class: deleteClass as any,
  lesson: deleteLesson as any,
  exam: deleteExam as any,
  assignment: deleteAssignment as any,
  result: deleteResult as any,
  event: deleteEvent as any,
  announcement: deleteAnnouncement as any,
  attendance: deleteAttendance as any,
};

type FormRenderer = (
  type: "create" | "update",
  data?: any,
  onSuccess?: () => void
) => ReactElement;

const forms: Record<TableType, FormRenderer> = {
  teacher: (type, data, onSuccess) => <TeacherForm type={type} data={data} onSuccess={onSuccess} />,
  student: (type, data, onSuccess) => <StudentForm type={type} data={data} onSuccess={onSuccess} />,
  parent: (type, data, onSuccess) => <ParentForm type={type} data={data} onSuccess={onSuccess} />,
  subject: (type, data, onSuccess) => <SubjectForm type={type} data={data} onSuccess={onSuccess} />,
  class: (type, data, onSuccess) => <ClassForm type={type} data={data} onSuccess={onSuccess} />,
  lesson: (type, data, onSuccess) => <LessonForm type={type} data={data} onSuccess={onSuccess} />,
  exam: (type, data, onSuccess) => <ExamForm type={type} data={data} onSuccess={onSuccess} />,
  assignment: (type, data, onSuccess) => <AssignmentForm type={type} data={data} onSuccess={onSuccess} />,
  result: (type, data, onSuccess) => <ResultForm type={type} data={data} onSuccess={onSuccess} />,
  event: (type, data, onSuccess) => <EventForm type={type} data={data} onSuccess={onSuccess} />,
  announcement: (type, data, onSuccess) => <AnnouncementForm type={type} data={data} onSuccess={onSuccess} />,
  attendance: (type, data, onSuccess) => <AttendanceForm type={type} data={data} onSuccess={onSuccess} />,
};

export type FormModalProps = {
  table: TableType;
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const triggerStyles = {
  create: {
    Icon: Plus,
    className:
      "h-9 w-9 bg-teal-600 text-white shadow-sm hover:bg-teal-700 focus-visible:ring-teal-500/30",
  },
  update: {
    Icon: Pencil,
    className:
      "h-8 w-8 border border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 focus-visible:ring-teal-500/20",
  },
  delete: {
    Icon: Trash2,
    className:
      "h-8 w-8 border border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:ring-red-500/20",
  },
} as const;

export default function FormModal({ table, type, data, id }: FormModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const { Icon, className } = triggerStyles[type];
  const triggerLabel = `${type === "create" ? "Add" : type === "update" ? "Edit" : "Delete"} ${table}`;

  // ESC se band + background scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleDelete = async () => {
    if (id === undefined || id === null) return;
    setLoading(true);
    setError("");

    try {
      const res = await deleteActionMap[table](String(id));

      if (res.success) {
        setLoading(false);
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to delete item.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong during deletion.");
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setOpen(false);
    router.refresh();
  };

  // NOTE: function ki tarah call hota hai (<FormContent /> nahi), warna har re-render
  // par form dobara mount hota tha aur typed data reset ho jata tha.
  const renderContent = () => {
    if (type === "delete" && id !== undefined) {
      return (
        <div className="flex flex-col items-center gap-4 p-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <TriangleAlert className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Delete <span className="capitalize">{table}</span>?
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              All related data will be lost. This action cannot be undone.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="w-full rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-600"
            >
              {error}
            </p>
          )}

          <div className="mt-1 flex w-full items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleDelete}
              className="h-10 flex-1 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      );
    }

    if (type === "create" || type === "update") {
      const renderForm = forms[table];
      if (!renderForm) {
        return (
          <p className="p-4 text-center text-sm text-slate-500">
            Form for &quot;{table}&quot; is not created yet!
          </p>
        );
      }
      return renderForm(type, data, handleSuccess);
    }

    return <p className="p-4 text-center text-sm text-slate-500">Form not found!</p>;
  };

  return (
    <>
      <button
        type="button"
        aria-label={triggerLabel}
        title={triggerLabel}
        className={`inline-flex shrink-0 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-4 ${className}`}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        <Icon className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ${
              type === "delete" ? "max-w-md" : "max-w-3xl"
            }`}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
            {renderContent()}
          </div>
        </div>
      )}
    </>
  );
}