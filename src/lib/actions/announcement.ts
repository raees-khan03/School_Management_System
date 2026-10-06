"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole } from "@/lib/getRole";

export async function createAnnouncement(data: {
  title: string;
  description: string;
  date: string;
  classId?: number | null;
}) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin." };

    await prisma.announcement.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        date: new Date(data.date),
        classId: data.classId ? Number(data.classId) : null,
      },
    });
    revalidatePath("/list/announcements");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed." };
  }
}

export async function updateAnnouncement(
  id: number,
  data: {
    title: string;
    description: string;
    date: string;
    classId?: number | null;
  }
) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin." };

    await prisma.announcement.update({
      where: { id: Number(id) },
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        date: new Date(data.date),
        classId: data.classId ? Number(data.classId) : null,
      },
    });
    revalidatePath("/list/announcements");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed." };
  }
}

export async function deleteAnnouncement(id: number | string) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin." };
    await prisma.announcement.delete({ where: { id: Number(id) } });
    revalidatePath("/list/announcements");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed." };
  }
}

export async function getAnnouncementFormData() {
  const classes = await prisma.class.findMany({ orderBy: { name: "asc" } });
  return { classes };
}