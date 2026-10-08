"use server";

import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";

export type SearchResultItem = {
  id: string | number;
  title: string;
  subtitle: string;
  type: "student" | "teacher" | "class" | "subject";
  url: string;
};

export async function globalSearch(query: string): Promise<SearchResultItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length < 2) return [];

  try {
    const { role } = await getAuthUser();
    if (!role) return [];

    // Search Students, Teachers, Classes, and Subjects in parallel
    const [students, teachers, classes, subjects] = await Promise.all([
      prisma.student.findMany({
        where: {
          OR: [
            { name: { contains: cleanQuery, mode: "insensitive" } },
            { surname: { contains: cleanQuery, mode: "insensitive" } },
            { username: { contains: cleanQuery, mode: "insensitive" } },
          ],
        },
        take: 4,
        include: { class: true },
      }),
      prisma.teacher.findMany({
        where: {
          OR: [
            { name: { contains: cleanQuery, mode: "insensitive" } },
            { surname: { contains: cleanQuery, mode: "insensitive" } },
            { username: { contains: cleanQuery, mode: "insensitive" } },
          ],
        },
        take: 4,
      }),
      prisma.class.findMany({
        where: { name: { contains: cleanQuery, mode: "insensitive" } },
        take: 3,
      }),
      prisma.subject.findMany({
        where: { name: { contains: cleanQuery, mode: "insensitive" } },
        take: 3,
      }),
    ]);

    const results: SearchResultItem[] = [];

    // 1. Format Students
    students.forEach((s) => {
      results.push({
        id: s.id,
        title: `${s.name} ${s.surname}`,
        subtitle: `Student • Class ${s.class?.name || "Unassigned"}`,
        type: "student",
        url: `/list/students/${s.id}`,
      });
    });

    // 2. Format Teachers
    teachers.forEach((t) => {
      results.push({
        id: t.id,
        title: `${t.name} ${t.surname}`,
        subtitle: `Teacher • @${t.username}`,
        type: "teacher",
        url: `/list/teachers/${t.id}`,
      });
    });

    // 3. Format Classes
    classes.forEach((c) => {
      results.push({
        id: c.id,
        title: `Class ${c.name}`,
        subtitle: "Class Section",
        type: "class",
        url: `/list/classes?search=${encodeURIComponent(c.name)}`,
      });
    });

    // 4. Format Subjects
    subjects.forEach((sub) => {
      results.push({
        id: sub.id,
        title: sub.name,
        subtitle: "Academic Subject",
        type: "subject",
        url: `/list/subjects?search=${encodeURIComponent(sub.name)}`,
      });
    });

    return results;
  } catch (err) {
    console.error("globalSearch Error:", err);
    return [];
  }
}