"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getRole } from "@/lib/getRole";
import { clerkClient } from "@clerk/nextjs/server";

export type ParentData = {
  username: string;
  name: string;
  surname: string;
  email?: string;
  phone: string;
  address: string;
  password?: string; // sirf Clerk ko jata hai, Neon mein save nahi hota
};

const MIN_PASSWORD = 16;
const MAX_PASSWORD = 72; // Clerk ki upper limit
const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;
const USERNAME_MSG = "Username can only contain letters, numbers, - or _.";

const passwordError = (p?: string) => {
  if (!p) return null;
  if (p.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
  if (p.length > MAX_PASSWORD) return `Password must be at most ${MAX_PASSWORD} characters.`;
  return null;
};

const clerkMsg = (e: any, fallback: string) =>
  e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || fallback;

// ==================== CREATE ====================
export async function createParent(formData: ParentData) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin can create parents." };

    const username = formData.username.trim();
    const phone = formData.phone.trim();
    const email = formData.email?.trim() || undefined;

    if (!USERNAME_RE.test(username)) return { success: false, error: USERNAME_MSG };

    if (!formData.password) return { success: false, error: "Password is required." };
    const pwErr = passwordError(formData.password);
    if (pwErr) return { success: false, error: pwErr };

    const existing = await prisma.parent.findFirst({
      where: {
        OR: [{ username }, { phone }, ...(email ? [{ email }] : [])],
      },
    });

    if (existing) return { success: false, error: "Username, phone, or email is taken." };

    // CLERK CREATION
    const client = await clerkClient();
    let clerkUser;

    try {
      clerkUser = await client.users.createUser({
        username,
        firstName: formData.name.trim(),
        lastName: formData.surname.trim(),
        ...(email ? { emailAddress: [email] } : {}),
        password: formData.password,
        skipPasswordChecks: true,
        publicMetadata: { role: "parent" },
      });
    } catch (clerkErr: any) {
      console.error("Clerk Error:", clerkErr);
      return { success: false, error: clerkMsg(clerkErr, "Failed to create user in Clerk.") };
    }

    // NEON CREATION (fail ho to Clerk user rollback)
    try {
      await prisma.parent.create({
        data: {
          id: clerkUser.id,
          username,
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          email: email || null,
          phone,
          address: formData.address.trim(),
        },
      });
    } catch (dbErr) {
      await client.users.deleteUser(clerkUser.id).catch(() => {});
      throw dbErr;
    }

    revalidatePath("/list/parents");
    return { success: true };
  } catch (err: any) {
    console.error("createParent:", err);
    return { success: false, error: "Failed to create parent." };
  }
}

// ==================== UPDATE ====================
export async function updateParent(id: string, formData: ParentData) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin can update parents." };

    const username = formData.username.trim();
    const phone = formData.phone.trim();
    const email = formData.email?.trim() || undefined;

    if (!USERNAME_RE.test(username)) return { success: false, error: USERNAME_MSG };

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

    try {
      await client.users.updateUser(id, {
        username,
        firstName: formData.name.trim(),
        lastName: formData.surname.trim(),
      });
    } catch (e) {
      console.log("Clerk profile update skipped:", e);
    }

    revalidatePath("/list/parents");
    revalidatePath(`/list/parents/${id}`);
    return { success: true };
  } catch (err: any) {
    console.error("updateParent:", err);
    return { success: false, error: "Failed to update parent." };
  }
}

// ==================== RESET PASSWORD ====================
export async function resetParentPassword(id: string, newPassword: string) {
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
    console.error("resetParentPassword:", e);
    return { success: false, error: clerkMsg(e, "Failed to reset password.") };
  }
}

// ==================== DELETE ====================
export async function deleteParent(id: string) {
  try {
    const role = await getRole();
    if (role !== "admin") return { success: false, error: "Only admin can delete parents." };

    const parent = await prisma.parent.findUnique({
      where: { id },
      include: { students: { select: { id: true } } },
    });

    if (!parent) return { success: false, error: "Parent not found." };
    const studentIds = parent.students.map((s) => s.id);

    await prisma.$transaction(async (tx) => {
      if (studentIds.length > 0) {
        await tx.attendance.deleteMany({ where: { studentId: { in: studentIds } } });
        await tx.result.deleteMany({ where: { studentId: { in: studentIds } } });
        await tx.student.deleteMany({ where: { parentId: id } });
      }
      await tx.parent.delete({ where: { id } });
    });

    // Parent aur uske bachon ke Clerk accounts bhi delete karo
    const client = await clerkClient();
    for (const userId of [id, ...studentIds]) {
      try {
        await client.users.deleteUser(userId);
      } catch (e) {
        console.log("Clerk user deletion skipped:", userId, e);
      }
    }

    revalidatePath("/list/parents");
    revalidatePath("/list/students");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to delete parent." };
  }
}