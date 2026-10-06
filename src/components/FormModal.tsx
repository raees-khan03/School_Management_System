"use client";

import Image from "next/image";
import { useState, type ReactElement } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

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

const Loading = () => (
  <p className="p-4 text-center text-slate-500 text-sm">Loading form...</p>
);

// Dynamic forms — file na mile to bhi crash na ho
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

const notImplemented = async (_id: string): Promise<DeleteResult> => ({
  success: false,
  error: "Delete action for this module is not implemented yet.",
});

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
  attendance: notImplemented,
};

type FormRenderer = (
  type: "create" | "update",
  data?: any,
  onSuccess?: () => void
) => ReactElement;

const forms: Partial<Record<TableType, FormRenderer>> = {
  teacher: (type, data, onSuccess) => (
    <TeacherForm type={type} data={data} onSuccess={onSuccess} />
  ),
  student: (type, data, onSuccess) => (
    <StudentForm type={type} data={data} onSuccess={onSuccess} />
  ),
  parent: (type, data, onSuccess) => (
    <ParentForm type={type} data={data} onSuccess={onSuccess} />
  ),
  subject: (type, data, onSuccess) => (
    <SubjectForm type={type} data={data} onSuccess={onSuccess} />
  ),
  class: (type, data, onSuccess) => (
    <ClassForm type={type} data={data} onSuccess={onSuccess} />
  ),
  lesson: (type, data, onSuccess) => (
    <LessonForm type={type} data={data} onSuccess={onSuccess} />
  ),
  exam: (type, data, onSuccess) => (
    <ExamForm type={type} data={data} onSuccess={onSuccess} />
  ),
  assignment: (type, data, onSuccess) => (
    <AssignmentForm type={type} data={data} onSuccess={onSuccess} />
  ),
  result: (type, data, onSuccess) => (
    <ResultForm type={type} data={data} onSuccess={onSuccess} />
  ),
  event: (type, data, onSuccess) => (
    <EventForm type={type} data={data} onSuccess={onSuccess} />
  ),
  announcement: (type, data, onSuccess) => (
    <AnnouncementForm type={type} data={data} onSuccess={onSuccess} />
  ),
};

export type FormModalProps = {
  table: TableType;
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormModal = ({ table, type, data, id }: FormModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-lamaYellow hover:opacity-80"
      : type === "update"
      ? "bg-lamaSky hover:opacity-80"
      : "bg-lamaPurple hover:opacity-80";

  const handleDelete = async () => {
    if (id === undefined || id === null) return;
    setLoading(true);
    setError("");

    try {
      const action = deleteActionMap[table];
      const res = await action(String(id));

      if (res.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to delete.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong during deletion.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setOpen(false);
    router.refresh();
  };

  const FormContent = () => {
    if (type === "delete" && id !== undefined) {
      return (
        <div className="p-4 flex flex-col gap-4">
          <span className="text-center font-medium text-slate-800">
            All data will be lost. Delete this {table}?
          </span>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 p-2 rounded-md text-center">
              {error}
            </p>
          )}
          <div className="flex items-center justify-center gap-4 mt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-slate-200 text-slate-700 py-2 px-4 rounded-md text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm font-medium disabled:opacity-50"
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
          <p className="text-center text-slate-500 p-4">
            Form for &quot;{table}&quot; is not available yet.
          </p>
        );
      }
      return renderForm(type, data, handleSuccess);
    }

    return <p className="text-center text-slate-500 p-4">Form not found.</p>;
  };

  return (
    <>
      <button
        type="button"
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        <Image src={`/${type}.png`} alt={type} width={16} height={16} />
      </button>

      {open && (
        <div className="w-screen h-screen fixed left-0 top-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto shadow-2xl">
            <FormContent />
            <button
              type="button"
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="close" width={14} height={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;