"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole, getAuthUser } from "@/lib/getRole";

export type AttendanceData = {
  date: string; // YYYY-MM-DD
  present: boolean;
  studentId: string;
  lessonId: number;
};

export async function createAttendance(formData: AttendanceData) {
  try {
    const { role, userId } = await getAuthUser();
    if (role !== "admin" && role !== "teacher") {
      return { success: false, error: "Not allowed to mark attendance." };
    }

    const lessonId = Number(formData.lessonId);
    const date = new Date(formData.date);
    if (isNaN(date.getTime())) {
      return { success: false, error: "Invalid date." };
    }

    // Teacher sirf apni lesson mark kar sake
    if (role === "teacher" && userId) {
      const lesson = await prisma.lesson.findFirst({
        where: { id: lessonId, teacherId: userId },
      });
      if (!lesson) {
        return { success: false, error: "You can only mark attendance for your own lessons." };
      }
    }

    // Same student + lesson + same calendar day duplicate na ho
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.attendance.findFirst({
      where: {
        studentId: formData.studentId,
        lessonId,
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    if (existing) {
      return {
        success: false,
        error: "Attendance already marked for this student on this lesson/date. Edit the existing record.",
      };
    }

    await prisma.attendance.create({
      data: {
        date,
        present: formData.present,
        studentId: formData.studentId,
        lessonId,
      },
    });

    revalidatePath("/list/attendance");
    return { success: true };
  } catch (err: any) {
    console.error("createAttendance:", err);
    return { success: false, error: err?.message || "Failed to create attendance." };
  }
}

export async function updateAttendance(id: number, formData: AttendanceData) {
  try {
    const { role, userId } = await getAuthUser();
    if (role !== "admin" && role !== "teacher") {
      return { success: false, error: "Not allowed." };
    }

    const lessonId = Number(formData.lessonId);
    const date = new Date(formData.date);
    if (isNaN(date.getTime())) {
      return { success: false, error: "Invalid date." };
    }

    if (role === "teacher" && userId) {
      const lesson = await prisma.lesson.findFirst({
        where: { id: lessonId, teacherId: userId },
      });
      if (!lesson) {
        return { success: false, error: "You can only update your own lessons." };
      }
    }

    await prisma.attendance.update({
      where: { id: Number(id) },
      data: {
        date,
        present: formData.present,
        studentId: formData.studentId,
        lessonId,
      },
    });

    revalidatePath("/list/attendance");
    return { success: true };
  } catch (err: any) {
    console.error("updateAttendance:", err);
    return { success: false, error: err?.message || "Failed to update attendance." };
  }
}

export async function deleteAttendance(id: number | string) {
  try {
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can delete attendance." };
    }

    await prisma.attendance.delete({ where: { id: Number(id) } });
    revalidatePath("/list/attendance");
    return { success: true };
  } catch (err: any) {
    console.error("deleteAttendance:", err);
    return { success: false, error: err?.message || "Failed to delete attendance." };
  }
}

/** Dropdown data for form */
export async function getAttendanceFormData() {
  const { role, userId } = await getAuthUser();

  const lessonWhere =
    role === "teacher" && userId ? { teacherId: userId } : {};

  const [students, lessons] = await Promise.all([
    prisma.student.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        classId: true,
        class: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.lesson.findMany({
      where: lessonWhere,
      select: {
        id: true,
        name: true,
        day: true,
        classId: true,
        subject: { select: { name: true } },
        class: { select: { name: true } },
        teacher: { select: { name: true, surname: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return { students, lessons };
}

/**
 * Bulk mark: one lesson + date → many students
 */
export async function bulkMarkAttendance(payload: {
  lessonId: number;
  date: string;
  records: { studentId: string; present: boolean }[];
}) {
  try {
    const { role, userId } = await getAuthUser();
    if (role !== "admin" && role !== "teacher") {
      return { success: false, error: "Not allowed." };
    }

    const lessonId = Number(payload.lessonId);
    const date = new Date(payload.date);
    if (isNaN(date.getTime())) {
      return { success: false, error: "Invalid date." };
    }

    if (role === "teacher" && userId) {
      const lesson = await prisma.lesson.findFirst({
        where: { id: lessonId, teacherId: userId },
      });
      if (!lesson) {
        return { success: false, error: "Not your lesson." };
      }
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    await prisma.$transaction(async (tx) => {
      for (const r of payload.records) {
        const existing = await tx.attendance.findFirst({
          where: {
            studentId: r.studentId,
            lessonId,
            date: { gte: dayStart, lte: dayEnd },
          },
        });

        if (existing) {
          await tx.attendance.update({
            where: { id: existing.id },
            data: { present: r.present },
          });
        } else {
          await tx.attendance.create({
            data: {
              studentId: r.studentId,
              lessonId,
              date,
              present: r.present,
            },
          });
        }
      }
    });

    revalidatePath("/list/attendance");
    return { success: true };
  } catch (err: any) {
    console.error("bulkMarkAttendance:", err);
    return { success: false, error: err?.message || "Failed to save attendance." };
  }
}