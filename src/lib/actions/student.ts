"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole } from "@/lib/getRole";

export type StudentData = {
  username: string;
  name: string;
  surname: string;
  email?: string;
  phone?: string;
  address: string;
  img?: string;
  bloodType: string;
  sex: "MALE" | "FEMALE";
  birthday: string;
  parentId: string;
  classId: number;
  gradeId: number;
};

// ==================== CREATE ====================
export async function createStudent(formData: StudentData) {
  try {
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can create students." };
    }

    const existing = await prisma.student.findFirst({
      where: {
        OR: [
          { username: formData.username },
          ...(formData.email ? [{ email: formData.email }] : []),
          ...(formData.phone ? [{ phone: formData.phone }] : []),
        ],
      },
    });

    if (existing) {
      return {
        success: false,
        error: "Username, email, or phone is already taken.",
      };
    }

    // Parent / Class / Grade exist?
    const [parent, classItem, grade] = await Promise.all([
      prisma.parent.findUnique({ where: { id: formData.parentId } }),
      prisma.class.findUnique({ where: { id: Number(formData.classId) } }),
      prisma.grade.findUnique({ where: { id: Number(formData.gradeId) } }),
    ]);

    if (!parent) return { success: false, error: "Selected parent not found." };
    if (!classItem) return { success: false, error: "Selected class not found." };
    if (!grade) return { success: false, error: "Selected grade not found." };

    const parsedBirthday = new Date(formData.birthday);
    if (isNaN(parsedBirthday.getTime())) {
      return { success: false, error: "Invalid birthday date." };
    }

    await prisma.student.create({
      data: {
        username: formData.username.trim(),
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address.trim(),
        img: formData.img || null,
        bloodType: formData.bloodType.trim(),
        sex: formData.sex,
        birthday: parsedBirthday,
        parentId: formData.parentId,
        classId: Number(formData.classId),
        gradeId: Number(formData.gradeId),
      },
    });

    revalidatePath("/list/students");
    return { success: true };
  } catch (err: any) {
    console.error("createStudent error:", err);
    if (err?.code === "P2002") {
      return {
        success: false,
        error: "Duplicate value — username/email/phone already exists.",
      };
    }
    if (err?.code === "P2003") {
      return {
        success: false,
        error: "Invalid parent, class, or grade reference.",
      };
    }
    return { success: false, error: err?.message || "Failed to create student." };
  }
}

// ==================== UPDATE ====================
export async function updateStudent(id: string, formData: StudentData) {
  console.log("UPDATE STUDENT CALLED:", id, formData);

  try {
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can update students." };
    }

    if (!id) return { success: false, error: "Student ID is missing." };

    const exists = await prisma.student.findUnique({ where: { id } });
    if (!exists) return { success: false, error: "Student not found." };

    const parsedBirthday = new Date(formData.birthday);
    if (isNaN(parsedBirthday.getTime())) {
      return { success: false, error: "Invalid birthday date." };
    }

    await prisma.student.update({
      where: { id },
      data: {
        username: formData.username.trim(),
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address.trim(),
        img: formData.img || null,
        bloodType: formData.bloodType.trim(),
        sex: formData.sex,
        birthday: parsedBirthday,
        parentId: formData.parentId,
        classId: Number(formData.classId),
        gradeId: Number(formData.gradeId),
      },
    });

    revalidatePath("/list/students");
    revalidatePath(`/list/students/${id}`);
    return { success: true };
  } catch (err: any) {
    console.error("updateStudent error:", err);
    if (err?.code === "P2002") {
      return {
        success: false,
        error: "Username, email, or phone already used by another student.",
      };
    }
    if (err?.code === "P2003") {
      return {
        success: false,
        error: "Invalid parent, class, or grade reference.",
      };
    }
    return { success: false, error: err?.message || "Failed to update student." };
  }
}

// ==================== DELETE (with cleanup) ====================
export async function deleteStudent(id: string) {
  console.log("DELETE STUDENT CALLED:", id);

  try {
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can delete students." };
    }

    if (!id) return { success: false, error: "Student ID is missing." };

    const exists = await prisma.student.findUnique({ where: { id } });
    if (!exists) return { success: false, error: "Student not found." };

    // Cascade cleanup then delete
    await prisma.$transaction(async (tx) => {
      await tx.attendance.deleteMany({ where: { studentId: id } });
      await tx.result.deleteMany({ where: { studentId: id } });
      await tx.student.delete({ where: { id } });
    });

    console.log("STUDENT DELETED SUCCESSFULLY");
    revalidatePath("/list/students");
    return { success: true };
  } catch (err: any) {
    console.error("deleteStudent error:", err);
    if (err?.code === "P2003") {
      return {
        success: false,
        error: "Cannot delete — student still has related records.",
      };
    }
    return { success: false, error: err?.message || "Failed to delete student." };
  }
}