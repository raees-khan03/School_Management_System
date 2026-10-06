"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole } from "@/lib/getRole";

export type ClassData = {
  name: string;
  capacity: number;
  gradeId: number;
  supervisorId?: string;
};

export async function createClass(formData: ClassData) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin can create classes." };

    const name = formData.name.trim();
    const existing = await prisma.class.findUnique({ where: { name } });
    if (existing) return { success: false, error: "Class name already exists." };

    await prisma.class.create({
      data: {
        name,
        capacity: Number(formData.capacity),
        gradeId: Number(formData.gradeId),
        supervisorId: formData.supervisorId || null,
      },
    });

    revalidatePath("/list/classes");
    return { success: true };
  } catch (err: any) {
    console.error("createClass:", err);
    if (err?.code === "P2002") return { success: false, error: "Class name already exists." };
    return { success: false, error: err?.message || "Failed to create class." };
  }
}

export async function updateClass(id: number, formData: ClassData) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin can update classes." };

    await prisma.class.update({
      where: { id: Number(id) },
      data: {
        name: formData.name.trim(),
        capacity: Number(formData.capacity),
        gradeId: Number(formData.gradeId),
        supervisorId: formData.supervisorId || null,
      },
    });

    revalidatePath("/list/classes");
    return { success: true };
  } catch (err: any) {
    console.error("updateClass:", err);
    if (err?.code === "P2002") return { success: false, error: "Class name already exists." };
    return { success: false, error: err?.message || "Failed to update class." };
  }
}

export async function deleteClass(id: number | string) {
    try {
      const role = await getRole();
      if (role !== "admin")
        return { success: false, error: "Only admin can delete classes." };
  
      const classId = Number(id);
  
      await prisma.$transaction(
        async (tx) => {
          // 1. Students aur Lessons ki IDs EK SATH fetch karein (Parallel)
          const [students, lessons] = await Promise.all([
            tx.student.findMany({ where: { classId }, select: { id: true } }),
            tx.lesson.findMany({ where: { classId }, select: { id: true } }),
          ]);
  
          const studentIds = students.map((s) => s.id);
          const lessonIds = lessons.map((l) => l.id);
  
          // 2. Students ki Attendance & Results Clean karein
          if (studentIds.length > 0) {
            await tx.attendance.deleteMany({
              where: { studentId: { in: studentIds } },
            });
            await tx.result.deleteMany({
              where: { studentId: { in: studentIds } },
            });
          }
  
          // 3. Lessons ki Attendance, Results, Exams, Assignments Clean karein
          if (lessonIds.length > 0) {
            await tx.attendance.deleteMany({
              where: { lessonId: { in: lessonIds } },
            });
            await tx.result.deleteMany({
              where: {
                OR: [
                  { exam: { lessonId: { in: lessonIds } } },
                  { assignment: { lessonId: { in: lessonIds } } },
                ],
              },
            });
            await tx.exam.deleteMany({ where: { lessonId: { in: lessonIds } } });
            await tx.assignment.deleteMany({
              where: { lessonId: { in: lessonIds } },
            });
          }
  
          // 4. Students aur Lessons Delete karein
          if (studentIds.length > 0) {
            await tx.student.deleteMany({ where: { classId } });
          }
          if (lessonIds.length > 0) {
            await tx.lesson.deleteMany({ where: { classId } });
          }
  
          // 5. Events, Announcements aur Class Delete karein
          await tx.event.deleteMany({ where: { classId } });
          await tx.announcement.deleteMany({ where: { classId } });
          await tx.class.delete({ where: { id: classId } });
        },
        {
          maxWait: 10000, // Max wait time 10s
          timeout: 20000, // Transaction timeout set to 20 seconds!
        }
      );
  
      revalidatePath("/list/classes");
      revalidatePath("/list/students");
      return { success: true };
    } catch (err: any) {
      console.error("deleteClass Error:", err);
      return {
        success: false,
        error: err?.message || "Failed to delete class.",
      };
    }
  }

export async function getClassFormData() {
  const [grades, teachers] = await Promise.all([
    prisma.grade.findMany({ orderBy: { level: "asc" } }),
    prisma.teacher.findMany({
      select: { id: true, name: true, surname: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { grades, teachers };
}