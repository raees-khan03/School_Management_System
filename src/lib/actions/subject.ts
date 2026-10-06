"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole } from "@/lib/getRole";

export type SubjectData = {
  name: string;
  teacherIds: string[]; // selected teacher IDs
};

// ==================== CREATE ====================
export async function createSubject(formData: SubjectData) {
  try {
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can create subjects." };
    }

    const name = formData.name.trim();
    if (!name) return { success: false, error: "Subject name is required." };

    const existing = await prisma.subject.findUnique({ where: { name } });
    if (existing) {
      return { success: false, error: "Subject name already exists." };
    }

    await prisma.subject.create({
      data: {
        name,
        teachers: {
          connect: (formData.teacherIds || []).map((id) => ({ id })),
        },
      },
    });

    revalidatePath("/list/subjects");
    return { success: true };
  } catch (err: any) {
    console.error("createSubject error:", err);
    if (err?.code === "P2002") {
      return { success: false, error: "Subject name already exists." };
    }
    return { success: false, error: err?.message || "Failed to create subject." };
  }
}

// ==================== UPDATE ====================
export async function updateSubject(id: number, formData: SubjectData) {
  console.log("UPDATE SUBJECT:", id, formData);

  try {
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can update subjects." };
    }

    if (!id) return { success: false, error: "Subject ID is missing." };

    const exists = await prisma.subject.findUnique({ where: { id } });
    if (!exists) return { success: false, error: "Subject not found." };

    const name = formData.name.trim();

    await prisma.subject.update({
      where: { id },
      data: {
        name,
        teachers: {
          // set = purane hata kar naye set karo
          set: (formData.teacherIds || []).map((tid) => ({ id: tid })),
        },
      },
    });

    revalidatePath("/list/subjects");
    revalidatePath(`/list/subjects/${id}`);
    return { success: true };
  } catch (err: any) {
    console.error("updateSubject error:", err);
    if (err?.code === "P2002") {
      return { success: false, error: "Subject name already exists." };
    }
    return { success: false, error: err?.message || "Failed to update subject." };
  }
}

// ==================== DELETE ====================
export async function deleteSubject(id: number | string) {
  console.log("DELETE SUBJECT:", id);

  try {
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can delete subjects." };
    }

    const subjectId = Number(id);
    if (!subjectId) return { success: false, error: "Invalid subject ID." };

    const exists = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!exists) return { success: false, error: "Subject not found." };

    // Pehle related lessons clean (agar cascade nahi hai)
    await prisma.$transaction(async (tx) => {
      const lessons = await tx.lesson.findMany({
        where: { subjectId },
        select: { id: true },
      });
      const lessonIds = lessons.map((l) => l.id);

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
        await tx.lesson.deleteMany({ where: { subjectId } });
      }

      // many-to-many disconnect automatic on delete
      await tx.subject.delete({ where: { id: subjectId } });
    });

    revalidatePath("/list/subjects");
    return { success: true };
  } catch (err: any) {
    console.error("deleteSubject error:", err);
    if (err?.code === "P2003") {
      return {
        success: false,
        error: "Cannot delete — subject still has related lessons.",
      };
    }
    return { success: false, error: err?.message || "Failed to delete subject." };
  }
}

// Teachers dropdown ke liye
export async function getSubjectFormData() {
  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true, surname: true },
    orderBy: { name: "asc" },
  });
  return { teachers };
}