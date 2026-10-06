"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole } from "@/lib/getRole";

export async function createExam(data: {
  title: string;
  startTime: string;
  endTime: string;
  lessonId: number;
}) {
  try {
    const role = await getRole();
    if (role !== "admin" && role !== "teacher")
      return { success: false, error: "Not allowed." };

    await prisma.exam.create({
      data: {
        title: data.title.trim(),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        lessonId: Number(data.lessonId),
      },
    });
    revalidatePath("/list/exams");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create exam." };
  }
}

export async function updateExam(
  id: number,
  data: { title: string; startTime: string; endTime: string; lessonId: number }
) {
  try {
    const role = await getRole();
    if (role !== "admin" && role !== "teacher")
      return { success: false, error: "Not allowed." };

    await prisma.exam.update({
      where: { id: Number(id) },
      data: {
        title: data.title.trim(),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        lessonId: Number(data.lessonId),
      },
    });
    revalidatePath("/list/exams");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update exam." };
  }
}

export async function deleteExam(id: number | string) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin." };

    await prisma.$transaction(async (tx) => {
      await tx.result.deleteMany({ where: { examId: Number(id) } });
      await tx.exam.delete({ where: { id: Number(id) } });
    });
    revalidatePath("/list/exams");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete exam." };
  }
}

export async function getExamFormData() {
  const lessons = await prisma.lesson.findMany({
    include: { subject: true, class: true, teacher: true },
    orderBy: { name: "asc" },
  });
  return { lessons };
}