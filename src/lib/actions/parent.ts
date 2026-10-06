"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole } from "@/lib/getRole";

export type ParentData = {
  username: string;
  name: string;
  surname: string;
  email?: string;
  phone: string;
  address: string;
};

// ==================== CREATE ====================
export async function createParent(formData: ParentData) {
  try {
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can create parents." };
    }

    const username = formData.username.trim();
    const phone = formData.phone.trim();
    const email = formData.email?.trim() || undefined;

    const existing = await prisma.parent.findFirst({
      where: {
        OR: [
          { username },
          { phone },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existing) {
      return {
        success: false,
        error: "Username, phone, or email is already taken.",
      };
    }

    await prisma.parent.create({
      data: {
        username,
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: email || null,
        phone,
        address: formData.address.trim(),
      },
    });

    revalidatePath("/list/parents");
    return { success: true };
  } catch (err: any) {
    console.error("createParent error:", err);
    if (err?.code === "P2002") {
      return {
        success: false,
        error: "Duplicate value — username, email, or phone already used.",
      };
    }
    return { success: false, error: err?.message || "Failed to create parent." };
  }
}

// ==================== UPDATE ====================
export async function updateParent(id: string, formData: ParentData) {
  console.log("UPDATE PARENT:", id, formData);

  try {
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can update parents." };
    }

    if (!id) return { success: false, error: "Parent ID is missing." };

    const exists = await prisma.parent.findUnique({ where: { id } });
    if (!exists) return { success: false, error: "Parent not found." };

    const username = formData.username.trim();
    const phone = formData.phone.trim();
    const email = formData.email?.trim() || undefined;

    await prisma.parent.update({
      where: { id },
      data: {
        username,
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: email || null,
        phone,
        address: formData.address.trim(),
      },
    });

    revalidatePath("/list/parents");
    revalidatePath(`/list/parents/${id}`);
    return { success: true };
  } catch (err: any) {
    console.error("updateParent error:", err);
    if (err?.code === "P2002") {
      return {
        success: false,
        error: "Username, email, or phone already used by another parent.",
      };
    }
    if (err?.code === "P2025") {
      return { success: false, error: "Parent not found." };
    }
    return { success: false, error: err?.message || "Failed to update parent." };
  }
}

// ==================== DELETE (cascade children + their data) ====================
export async function deleteParent(id: string) {
  console.log("DELETE PARENT:", id);

  try {
    const role = await getRole();
    if (role !== "admin") {
      return { success: false, error: "Only admin can delete parents." };
    }

    if (!id) return { success: false, error: "Parent ID is missing." };

    const parent = await prisma.parent.findUnique({
      where: { id },
      include: { students: { select: { id: true } } },
    });

    if (!parent) return { success: false, error: "Parent not found." };

    const studentIds = parent.students.map((s) => s.id);

    // Transaction: pehle bacchon ka related data, phir students, phir parent
    await prisma.$transaction(async (tx) => {
      if (studentIds.length > 0) {
        await tx.attendance.deleteMany({
          where: { studentId: { in: studentIds } },
        });
        await tx.result.deleteMany({
          where: { studentId: { in: studentIds } },
        });
        await tx.student.deleteMany({
          where: { parentId: id },
        });
      }

      await tx.parent.delete({ where: { id } });
    });

    console.log("PARENT DELETED SUCCESSFULLY");
    revalidatePath("/list/parents");
    revalidatePath("/list/students");
    return { success: true };
  } catch (err: any) {
    console.error("deleteParent error:", err);
    if (err?.code === "P2003") {
      return {
        success: false,
        error:
          "Cannot delete parent — still linked to other records. Reassign or remove children first.",
      };
    }
    return { success: false, error: err?.message || "Failed to delete parent." };
  }
}