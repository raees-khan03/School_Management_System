"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole } from "@/lib/getRole";
import { clerkClient } from "@clerk/nextjs/server";
import { toDate } from "@/lib/utils";

export type StudentData = {
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
  parentId: string;
  classId: number;
  gradeId: number;
  password?: string; // sirf Clerk ko jata hai, Neon mein save nahi hota
};

const MIN_PASSWORD = 16;
const MAX_PASSWORD = 72; // Clerk ki upper limit
const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;
const USERNAME_MSG = "Username can only contain letters, numbers, - or _.";

type Client = Awaited<ReturnType<typeof clerkClient>>;

const passwordError = (p?: string) => {
  if (!p) return null;
  if (p.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
  if (p.length > MAX_PASSWORD) return `Password must be at most ${MAX_PASSWORD} characters.`;
  return null;
};

const clerkMsg = (e: any, fallback: string) =>
  e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || fallback;

// UploadThing ki image URL se Clerk ki profile image set/remove karta hai.
// Fail ho to main kaam nahi rokta, sirf log karta hai.
async function syncClerkImage(client: Client, userId: string, url?: string | null) {
  try {
    if (url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
      const blob = await res.blob();
      await client.users.updateUserProfileImage(userId, { file: blob });
    } else {
      await client.users.deleteUserProfileImage(userId);
    }
  } catch (e) {
    console.error("Clerk image sync failed:", e);
  }
}

// ==================== CREATE ====================
export async function createStudent(formData: StudentData) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin can create students." };

    if (!USERNAME_RE.test(formData.username.trim())) return { success: false, error: USERNAME_MSG };

    if (!formData.password) return { success: false, error: "Password is required." };
    const pwErr = passwordError(formData.password);
    if (pwErr) return { success: false, error: pwErr };

    const existing = await prisma.student.findFirst({
      where: {
        OR: [
          { username: formData.username.trim() },
          ...(formData.email ? [{ email: formData.email.trim() }] : []),
          ...(formData.phone ? [{ phone: formData.phone.trim() }] : []),
        ],
      },
    });

    if (existing) return { success: false, error: "Username, email, or phone is already taken." };

    // CLERK CREATION
    const client = await clerkClient();
    let clerkUser;

    try {
      clerkUser = await client.users.createUser({
        username: formData.username.trim(),
        firstName: formData.name.trim(),
        lastName: formData.surname.trim(),
        ...(formData.email ? { emailAddress: [formData.email.trim()] } : {}),
        password: formData.password,
        skipPasswordChecks: true,
        publicMetadata: { role: "student" },
      });
    } catch (clerkErr: any) {
      console.error("Clerk Error:", clerkErr);
      return { success: false, error: clerkMsg(clerkErr, "Failed to create user in Clerk.") };
    }

    // NEON CREATION (fail ho to Clerk user rollback)
    try {
      await prisma.student.create({
        data: {
          id: clerkUser.id,
          username: formData.username.trim(),
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          email: formData.email?.trim() || null,
          phone: formData.phone?.trim() || null,
          address: formData.address.trim(),
          img: formData.img || null,
          bloodType: formData.bloodType.trim(),
          sex: formData.sex,
          birthday: toDate(formData.birthday),
          parentId: formData.parentId,
          classId: Number(formData.classId),
          gradeId: Number(formData.gradeId),
        },
      });
    } catch (dbErr) {
      await client.users.deleteUser(clerkUser.id).catch(() => {});
      throw dbErr;
    }

    if (formData.img) await syncClerkImage(client, clerkUser.id, formData.img);

    revalidatePath("/list/students");
    return { success: true };
  } catch (err: any) {
    console.error("createStudent:", err);
    return { success: false, error: "Failed to save student." };
  }
}

// ==================== UPDATE ====================
export async function updateStudent(id: string, formData: StudentData) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin can update students." };

    if (!USERNAME_RE.test(formData.username.trim())) return { success: false, error: USERNAME_MSG };

    const client = await clerkClient();

    // Password diya ho to Clerk mein update (khali ho to purana rahega)
    if (formData.password) {
      const pwErr = passwordError(formData.password);
      if (pwErr) return { success: false, error: pwErr };

      try {
        await client.users.updateUser(id, {
          password: formData.password,
          skipPasswordChecks: true,
          signOutOfOtherSessions: true,
        });
      } catch (e: any) {
        console.error("Clerk password update:", e);
        return { success: false, error: clerkMsg(e, "Failed to update password.") };
      }
    }

    const current = await prisma.student.findUnique({ where: { id }, select: { img: true } });

    await prisma.student.update({
      where: { id },
      data: {
        username: formData.username.trim(),
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address.trim(),
        img: formData.img || null,
        bloodType: formData.bloodType.trim(),
        sex: formData.sex,
        birthday: toDate(formData.birthday),
        parentId: formData.parentId,
        classId: Number(formData.classId),
        gradeId: Number(formData.gradeId),
      },
    });

    try {
      await client.users.updateUser(id, {
        username: formData.username.trim(),
        firstName: formData.name.trim(),
        lastName: formData.surname.trim(),
      });
    } catch (e) {
      console.log("Clerk profile update skipped:", e);
    }

    if ((formData.img || null) !== (current?.img || null)) {
      await syncClerkImage(client, id, formData.img);
    }

    revalidatePath("/list/students");
    revalidatePath(`/list/students/${id}`);
    return { success: true };
  } catch (err: any) {
    console.error("updateStudent:", err);
    return { success: false, error: "Failed to update student." };
  }
}

// ==================== RESET PASSWORD ====================
export async function resetStudentPassword(id: string, newPassword: string) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin can reset passwords." };

    if (!newPassword) return { success: false, error: "Password is required." };
    const pwErr = passwordError(newPassword);
    if (pwErr) return { success: false, error: pwErr };

    const client = await clerkClient();
    await client.users.updateUser(id, {
      password: newPassword,
      skipPasswordChecks: true,
      signOutOfOtherSessions: true,
    });
    return { success: true };
  } catch (e: any) {
    console.error("resetStudentPassword:", e);
    return { success: false, error: clerkMsg(e, "Failed to reset password.") };
  }
}

// ==================== DELETE ====================
export async function deleteStudent(id: string) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin can delete students." };

    await prisma.$transaction(async (tx) => {
      await tx.attendance.deleteMany({ where: { studentId: id } });
      await tx.result.deleteMany({ where: { studentId: id } });
      await tx.student.delete({ where: { id } });
    });

    try {
      const client = await clerkClient();
      await client.users.deleteUser(id);
    } catch (e) {}

    revalidatePath("/list/students");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to delete student." };
  }
}