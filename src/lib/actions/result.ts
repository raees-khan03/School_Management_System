"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole } from "@/lib/getRole";

export async function createResult(data: {
  score: number;
  studentId: string;
  examId?: number | null;
  assignmentId?: number | null;
}) {
  try {
    const role = await getRole();
    if (role !== "admin" && role !== "teacher")
      return { success: false, error: "Not allowed." };

    if (!data.examId && !data.assignmentId) {
      return { success: false, error: "Select exam or assignment." };
    }

    await prisma.result.create({
      data: {
        score: Number(data.score),
        studentId: data.studentId,
        examId: data.examId ? Number(data.examId) : null,
        assignmentId: data.assignmentId ? Number(data.assignmentId) : null,
      },
    });
    revalidatePath("/list/results");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed." };
  }
}

export async function updateResult(
  id: number,
  data: {
    score: number;
    studentId: string;
    examId?: number | null;
    assignmentId?: number | null;
  }
) {
  try {
    const role = await getRole();
    if (role !== "admin" && role !== "teacher")
      return { success: false, error: "Not allowed." };

    await prisma.result.update({
      where: { id: Number(id) },
      data: {
        score: Number(data.score),
        studentId: data.studentId,
        examId: data.examId ? Number(data.examId) : null,
        assignmentId: data.assignmentId ? Number(data.assignmentId) : null,
      },
    });
    revalidatePath("/list/results");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed." };
  }
}

export async function deleteResult(id: number | string) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin." };
    await prisma.result.delete({ where: { id: Number(id) } });
    revalidatePath("/list/results");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed." };
  }
}

export async function getResultFormData() {
  const [students, exams, assignments] = await Promise.all([
    prisma.student.findMany({
      select: { id: true, name: true, surname: true },
      orderBy: { name: "asc" },
    }),
    prisma.exam.findMany({
      include: { lesson: { include: { subject: true } } },
      orderBy: { title: "asc" },
    }),
    prisma.assignment.findMany({
      include: { lesson: { include: { subject: true } } },
      orderBy: { title: "asc" },
    }),
  ]);
  return { students, exams, assignments };
}