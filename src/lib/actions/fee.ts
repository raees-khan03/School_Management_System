"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import { getSystemSettings } from "@/lib/actions/notification";

export async function getStudentsForFee() {
  const students = await prisma.student.findMany({
    select: {
      id: true,
      name: true,
      surname: true,
      username: true,
      class: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });
  return students;
}

export async function collectFee(data: {
  studentId: string;
  studentName: string;
  className: string;
  amount: number;
  month: string;
  paymentMethod: string;
}) {
  try {
    const { role } = await getAuthUser();
    if (role !== "admin") {
      return { success: false, error: "Only admins can collect fees." };
    }

    // 1. Save as Income in Transaction table
    const transaction = await prisma.transaction.create({
      data: {
        title: `Fee Payment - ${data.studentName}`,
        amount: Number(data.amount),
        type: "INCOME",
        category: "Fee",
        description: `Month: ${data.month} | Student: ${data.studentName} (${data.className}) | Method: ${data.paymentMethod}`,
        date: new Date(),
      },
    });

    // 2. Check Admin Settings for In-App Notifications
    const settings = await getSystemSettings();

    if (settings.enableFeeNotifications) {
      // Find Student & Parent ID
      const student = await prisma.student.findUnique({
        where: { id: data.studentId },
        select: { id: true, parentId: true },
      });

      if (student) {
        const notifTitle = "Fee Payment Received";
        const notifMsg = `Fee payment of Rs ${data.amount.toLocaleString("en-PK")} for ${data.month} (${data.studentName}) has been received via ${data.paymentMethod}.`;

        const notifs = [{ title: notifTitle, message: notifMsg, userId: student.id }];

        if (student.parentId) {
          notifs.push({ title: notifTitle, message: notifMsg, userId: student.parentId });
        }

        await prisma.notification.createMany({ data: notifs });
      }
    }

    revalidatePath("/list/finance");
    revalidatePath("/admin");
    return { success: true, transactionId: transaction.id };
  } catch (err: any) {
    console.error("collectFee Error:", err);
    return { success: false, error: "Failed to save fee record." };
  }
}