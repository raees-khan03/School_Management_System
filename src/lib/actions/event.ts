"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole } from "@/lib/getRole";

export async function createEvent(data: {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  classId?: number | null;
}) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin." };

    await prisma.event.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        classId: data.classId ? Number(data.classId) : null,
      },
    });
    revalidatePath("/list/events");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed." };
  }
}

export async function updateEvent(
  id: number,
  data: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    classId?: number | null;
  }
) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin." };

    await prisma.event.update({
      where: { id: Number(id) },
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        classId: data.classId ? Number(data.classId) : null,
      },
    });
    revalidatePath("/list/events");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed." };
  }
}

export async function deleteEvent(id: number | string) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin." };
    await prisma.event.delete({ where: { id: Number(id) } });
    revalidatePath("/list/events");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed." };
  }
}

export async function getEventFormData() {
  const classes = await prisma.class.findMany({ orderBy: { name: "asc" } });
  return { classes };
}