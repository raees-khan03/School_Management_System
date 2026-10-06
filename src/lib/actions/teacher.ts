"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole } from "@/lib/getRole";

// Teacher Payload Type Definition
export type TeacherData = {
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
};

// ==========================================
// 1. CREATE TEACHER
// ==========================================
export async function createTeacher(formData: TeacherData) {
  try {
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can create teachers." };
    }

    // Username, Email ya Phone duplicate na ho
    const existing = await prisma.teacher.findFirst({
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

    // Birthday Date Parsing
    const parsedBirthday = new Date(formData.birthday);
    if (isNaN(parsedBirthday.getTime())) {
      return { success: false, error: "Invalid birthday date provided." };
    }

    await prisma.teacher.create({
      data: {
        username: formData.username,
        name: formData.name,
        surname: formData.surname,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address,
        img: formData.img || null,
        bloodType: formData.bloodType,
        sex: formData.sex,
        birthday: parsedBirthday,
      },
    });

    revalidatePath("/list/teachers");
    return { success: true };
  } catch (err: any) {
    console.error("createTeacher error:", err);
    if (err?.code === "P2002") {
      return {
        success: false,
        error: "Duplicate value — username/email/phone already exists.",
      };
    }
    return { success: false, error: "Failed to create teacher." };
  }
}

// ==========================================
// 2. UPDATE TEACHER
// ==========================================
export async function updateTeacher(id: string, formData: TeacherData) {
  console.log("UPDATE ACTION CALLED FOR ID:", id);
  console.log("PAYLOAD RECEIVED:", formData);

  try {
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can update teachers." };
    }

    if (!id) {
      return { success: false, error: "Teacher ID is missing." };
    }

    const teacherExists = await prisma.teacher.findUnique({ where: { id } });
    if (!teacherExists) {
      return { success: false, error: "Teacher not found in database." };
    }

    // Birthday Date Parsing
    const parsedBirthday = new Date(formData.birthday);
    if (isNaN(parsedBirthday.getTime())) {
      return { success: false, error: "Invalid birthday date provided." };
    }

    await prisma.teacher.update({
      where: { id },
      data: {
        username: formData.username,
        name: formData.name,
        surname: formData.surname,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address,
        img: formData.img || null,
        bloodType: formData.bloodType,
        sex: formData.sex,
        birthday: parsedBirthday,
      },
    });

    revalidatePath("/list/teachers");
    revalidatePath(`/list/teachers/${id}`);
    return { success: true };
  } catch (err: any) {
    console.error("updateTeacher error:", err);
    if (err?.code === "P2002") {
      return {
        success: false,
        error: "Username, email, or phone is already used by another teacher.",
      };
    }
    return {
      success: false,
      error: err?.message || "Failed to update teacher.",
    };
  }
}

// ==========================================
// 3. DELETE TEACHER
// ==========================================
// ==========================================
// 3. DELETE TEACHER (CASCADE CLEANUP)
// ==========================================
export async function deleteTeacher(id: string) {
  console.log("DELETE ACTION CALLED FOR ID:", id);

  try {
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can delete teachers." };
    }

    if (!id) {
      return { success: false, error: "Teacher ID is missing." };
    }

    const teacherExists = await prisma.teacher.findUnique({ where: { id } });
    if (!teacherExists) {
      return { success: false, error: "Teacher not found in database." };
    }

    // Prisma Transaction: Saare related data ko safe tareeqe se pehle clean karo
    await prisma.$transaction(async (tx) => {
      // 1. Class se Supervisor ID hatao (null karo)
      await tx.class.updateMany({
        where: { supervisorId: id },
        data: { supervisorId: null },
      });

      // 2. Is teacher ke lessons se judi Attendances delete karo
      await tx.attendance.deleteMany({
        where: { lesson: { teacherId: id } },
      });

      // 3. Is teacher ke Exams/Assignments ke Results delete karo
      await tx.result.deleteMany({
        where: {
          OR: [
            { exam: { lesson: { teacherId: id } } },
            { assignment: { lesson: { teacherId: id } } },
          ],
        },
      });

      // 4. Is teacher ke Exams & Assignments delete karo
      await tx.exam.deleteMany({
        where: { lesson: { teacherId: id } },
      });
      await tx.assignment.deleteMany({
        where: { lesson: { teacherId: id } },
      });

      // 5. Is teacher ke Lessons delete karo
      await tx.lesson.deleteMany({
        where: { teacherId: id },
      });

      // 6. Aakhir mein Teacher ko delete karo
      await tx.teacher.delete({
        where: { id },
      });
    });

    console.log("TEACHER DELETED SUCCESSFULLY FROM NEON DB");

    revalidatePath("/list/teachers");
    return { success: true };
  } catch (err: any) {
    console.error("deleteTeacher Error:", err);
    return {
      success: false,
      error: err?.message || "Failed to delete teacher.",
    };
  }
}