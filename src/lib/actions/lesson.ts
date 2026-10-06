"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole } from "@/lib/getRole";

export type LessonData = {
  name: string;
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";
  startTime: string;
  endTime: string;
  subjectId: number;
  classId: number;
  teacherId: string;
};

function parseTime(timeStr: string): Date {
  const d = new Date();
  if (timeStr.includes("T")) {
    const parsed = new Date(timeStr);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  const [hours, minutes] = timeStr.split(":").map(Number);
  d.setHours(hours || 0, minutes || 0, 0, 0);
  return d;
}

export async function createLesson(formData: LessonData) {
  try {
    const role = await getRole();
    if (role !== "admin" && role !== "teacher") {
      return { success: false, error: "Not authorized." };
    }

    await prisma.lesson.create({
      data: {
        name: formData.name.trim(),
        day: formData.day,
        startTime: parseTime(formData.startTime),
        endTime: parseTime(formData.endTime),
        subjectId: Number(formData.subjectId),
        classId: Number(formData.classId),
        teacherId: formData.teacherId,
      },
    });

    revalidatePath("/list/lessons");
    return { success: true };
  } catch (err: any) {
    console.error("createLesson:", err);
    return { success: false, error: err?.message || "Failed to create lesson." };
  }
}

export async function updateLesson(id: number, formData: LessonData) {
  try {
    const role = await getRole();
    if (role !== "admin" && role !== "teacher") {
      return { success: false, error: "Not authorized." };
    }

    await prisma.lesson.update({
      where: { id: Number(id) },
      data: {
        name: formData.name.trim(),
        day: formData.day,
        startTime: parseTime(formData.startTime),
        endTime: parseTime(formData.endTime),
        subjectId: Number(formData.subjectId),
        classId: Number(formData.classId),
        teacherId: formData.teacherId,
      },
    });

    revalidatePath("/list/lessons");
    return { success: true };
  } catch (err: any) {
    console.error("updateLesson:", err);
    return { success: false, error: err?.message || "Failed to update lesson." };
  }
}

export async function deleteLesson(id: number | string) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin can delete lessons." };

    const lessonId = Number(id);

    await prisma.$transaction(async (tx) => {
      await tx.attendance.deleteMany({ where: { lessonId } });
      await tx.result.deleteMany({
        where: {
          OR: [
            { exam: { lessonId } },
            { assignment: { lessonId } },
          ],
        },
      });
      await tx.exam.deleteMany({ where: { lessonId } });
      await tx.assignment.deleteMany({ where: { lessonId } });
      await tx.lesson.delete({ where: { id: lessonId } });
    });

    revalidatePath("/list/lessons");
    return { success: true };
  } catch (err: any) {
    console.error("deleteLesson:", err);
    return { success: false, error: err?.message || "Failed to delete lesson." };
  }
}

export async function getLessonFormData() {
  const [subjects, classes, teachers] = await Promise.all([
    prisma.subject.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.class.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.teacher.findMany({
      select: { id: true, name: true, surname: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { subjects, classes, teachers };
}