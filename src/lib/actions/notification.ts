"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";

// 1. Fetch In-App Notifications for Logged-In User
export async function getUserNotifications() {
  try {
    const { userId } = await getAuthUser();
    if (!userId) return [];

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return JSON.parse(JSON.stringify(notifications));
  } catch (err) {
    console.error("getUserNotifications error:", err);
    return [];
  }
}

// 2. Mark Notification as Read
export async function markNotificationAsRead(id: number) {
  try {
    const { userId } = await getAuthUser();
    if (!userId) return { success: false };

    await prisma.notification.update({
      where: { id: Number(id) },
      data: { isRead: true },
    });

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

// 3. Get System Settings (Admin Toggles)
export async function getSystemSettings() {
  try {
    let settings = await prisma.systemSetting.findFirst();
    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          id: 1,
          enableFeeNotifications: true,
          enableFeeReminders: true,
          reminderDayOfMonth: 5,
        },
      });
    }
    return JSON.parse(JSON.stringify(settings));
  } catch (err) {
    return {
      enableFeeNotifications: true,
      enableFeeReminders: true,
      reminderDayOfMonth: 5,
    };
  }
}

// 4. Update System Settings (Admin Toggle Save)
export async function updateSystemSettings(data: {
  enableFeeNotifications: boolean;
  enableFeeReminders: boolean;
}) {
  try {
    const { role } = await getAuthUser();
    if (role !== "admin") return { success: false, error: "Only admin can update settings." };

    await prisma.systemSetting.upsert({
      where: { id: 1 },
      update: {
        enableFeeNotifications: data.enableFeeNotifications,
        enableFeeReminders: data.enableFeeReminders,
      },
      create: {
        id: 1,
        enableFeeNotifications: data.enableFeeNotifications,
        enableFeeReminders: data.enableFeeReminders,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to update settings." };
  }
}

// 5. Trigger Monthly Fee Reminders for Unpaid Students
export async function sendMonthlyFeeReminders() {
  try {
    const { role } = await getAuthUser();
    if (role !== "admin") return { success: false, error: "Only admin can trigger reminders." };

    const settings = await getSystemSettings();
    if (!settings.enableFeeReminders) {
      return { success: false, error: "Fee reminders are currently disabled in settings." };
    }

    const currentMonthYear = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

    // Find all transactions for this month
    const paidTransactions = await prisma.transaction.findMany({
      where: {
        category: "Fee",
        date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      select: { description: true, title: true },
    });

    // Find all students
    const students = await prisma.student.findMany({
      select: { id: true, name: true, surname: true, parentId: true },
    });

    // Filter unpaid students
    const unpaidStudents = students.filter((student) => {
      const studentFullName = `${student.name} ${student.surname}`;
      const isPaid = paidTransactions.some(
        (t) => t.title.includes(studentFullName) || t.description?.includes(studentFullName)
      );
      return !isPaid;
    });

    if (unpaidStudents.length === 0) {
      return { success: true, count: 0, message: "All students have paid fees for this month!" };
    }

    // Create notifications for unpaid students & parents
    const notificationsToCreate: { title: string; message: string; userId: string }[] = [];

    unpaidStudents.forEach((student) => {
      const msg = `Reminder: Fee payment for ${currentMonthYear} is pending for ${student.name} ${student.surname}. Please clear the dues.`;
      
      // Notify student
      notificationsToCreate.push({
        title: "Fee Payment Pending",
        message: msg,
        userId: student.id,
      });

      // Notify parent if linked
      if (student.parentId) {
        notificationsToCreate.push({
          title: "Fee Reminder",
          message: msg,
          userId: student.parentId,
        });
      }
    });

    await prisma.notification.createMany({
      data: notificationsToCreate,
    });

    revalidatePath("/");
    return {
      success: true,
      count: unpaidStudents.length,
      message: `Sent fee reminders to ${unpaidStudents.length} unpaid student(s) & parents.`,
    };
  } catch (err: any) {
    console.error("sendMonthlyFeeReminders Error:", err);
    return { success: false, error: "Failed to send reminders." };
  }
}