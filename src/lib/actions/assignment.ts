"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole } from "@/lib/getRole";

export async function createAssignment(data: {
  title: string;
  startDate: string;
  dueDate: string;
  lessonId: number;
}) {
  try {
    const role = await getRole();
    if (role !== "admin" && role !== "teacher")
      return { success: false, error: "Not allowed." };

    await prisma.assignment.create({
      data: {
        title: data.title.trim(),
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
        lessonId: Number(data.lessonId),
      },
    });
    revalidatePath("/list/assignments");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed." };
  }
}

export async function updateAssignment(
  id: number,
  data: { title: string; startDate: string; dueDate: string; lessonId: number }
) {
  try {
    const role = await getRole();
    if (role !== "admin" && role !== "teacher")
      return { success: false, error: "Not allowed." };

    await prisma.assignment.update({
      where: { id: Number(id) },
      data: {
        title: data.title.trim(),
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
        lessonId: Number(data.lessonId),
      },
    });
    revalidatePath("/list/assignments");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed." };
  }
}

export async function deleteAssignment(id: number | string) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin." };

    await prisma.$transaction(async (tx) => {
      await tx.result.deleteMany({ where: { assignmentId: Number(id) } });
      await tx.assignment.delete({ where: { id: Number(id) } });
    });
    revalidatePath("/list/assignments");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed." };
  }
}

export async function getAssignmentFormData() {
  const lessons = await prisma.lesson.findMany({
    include: { subject: true, class: true, teacher: true },
    orderBy: { name: "asc" },
  });
  return { lessons };
}