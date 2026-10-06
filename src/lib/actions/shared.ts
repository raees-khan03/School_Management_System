"use server";

import prisma from "@/lib/prisma";



export async function getStudentFormData() {
  const [parents, classes, grades] = await Promise.all([
    prisma.parent.findMany({
      select: { id: true, name: true, surname: true },
      orderBy: { name: "asc" },
    }),
    prisma.class.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.grade.findMany({
      select: { id: true, level: true },
      orderBy: { level: "asc" },
    }),
  ]);

  return { parents, classes, grades };
}