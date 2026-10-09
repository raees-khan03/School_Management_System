"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole } from "@/lib/getRole";

export type FinanceData = {
  title: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string;
  description?: string;
};

export async function createTransaction(formData: FinanceData) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin can add transactions." };

    await prisma.transaction.create({
      data: {
        title: formData.title.trim(),
        amount: Number(formData.amount),
        type: formData.type,
        category: formData.category.trim(),
        date: new Date(formData.date),
        description: formData.description?.trim() || null,
      },
    });

    revalidatePath("/list/finance");
    revalidatePath("/admin"); // ✅ Chart ko refresh karne ke liye
    return { success: true };
  } catch (err: any) {
    console.error("createTransaction error:", err);
    return { success: false, error: "Failed to create transaction." };
  }
}

export async function updateTransaction(id: number, formData: FinanceData) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin can update transactions." };

    await prisma.transaction.update({
      where: { id: Number(id) },
      data: {
        title: formData.title.trim(),
        amount: Number(formData.amount),
        type: formData.type,
        category: formData.category.trim(),
        date: new Date(formData.date),
        description: formData.description?.trim() || null,
      },
    });

    revalidatePath("/list/finance");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("updateTransaction error:", err);
    return { success: false, error: "Failed to update transaction." };
  }
}

export async function deleteTransaction(id: number | string) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin can delete transactions." };

    await prisma.transaction.delete({ where: { id: Number(id) } });

    revalidatePath("/list/finance");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("deleteTransaction error:", err);
    return { success: false, error: "Failed to delete transaction." };
  }
}