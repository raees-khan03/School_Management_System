"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole } from "@/lib/getRole";

// ---------- Shared helpers ----------
function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

// ---------- CREATE TEACHER ----------
export async function createTeacher(formData: {
  username: string;
  name: string;
  surname: string;
  email?: string;
  phone?: string;
  address: string;
  img?: string;
  bloodType: string;
  sex: "MALE" | "FEMALE";
  birthday: string; // "YYYY-MM-DD"
}) {
  try {
    // Sirf admin teacher bana sake
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can create teachers." };
    }

    // Unique checks
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
        error: "Username, email or phone already exists.",
      };
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
        birthday: toDate(formData.birthday),
      },
    });

    revalidatePath("/list/teachers");
    return { success: true };
  } catch (err: any) {
    console.error("createTeacher error:", err);
    // Prisma unique constraint
    if (err?.code === "P2002") {
      return { success: false, error: "Duplicate value — username/email/phone already used." };
    }
    return { success: false, error: "Failed to create teacher." };
  }
}

// ---------- UPDATE TEACHER ----------
export async function updateTeacher(
  id: string,
  formData: {
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
  }
) {
  try {
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can update teachers." };
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
        birthday: toDate(formData.birthday),
      },
    });

    revalidatePath("/list/teachers");
    revalidatePath(`/list/teachers/${id}`);
    return { success: true };
  } catch (err: any) {
    console.error("updateTeacher error:", err);
    if (err?.code === "P2002") {
      return { success: false, error: "Duplicate value — username/email/phone already used." };
    }
    if (err?.code === "P2025") {
      return { success: false, error: "Teacher not found." };
    }
    return { success: false, error: "Failed to update teacher." };
  }
}

// ---------- DELETE TEACHER ----------
export async function deleteTeacher(id: string) {
  try {
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can delete teachers." };
    }

    // Related lessons etc. par cascade na ho to pehle check / cleanup
    await prisma.teacher.delete({ where: { id } });

    revalidatePath("/list/teachers");
    return { success: true };
  } catch (err: any) {
    console.error("deleteTeacher error:", err);
    if (err?.code === "P2003") {
      return {
        success: false,
        error: "Cannot delete — teacher has related lessons/classes. Remove those first.",
      };
    }
    return { success: false, error: "Failed to delete teacher." };
  }
}