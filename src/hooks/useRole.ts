"use client";

import { useUser } from "@clerk/nextjs";
import { UserRole } from "@/types/globals";

/**
 * Client-side components ke liye role hook.
 */
export function useRole() {
  const { user, isLoaded } = useUser();
  const role = (user?.publicMetadata?.role as UserRole) || null;

  return {
    role,
    isLoaded,
    user,
    isAdmin: role === "admin",
    isTeacher: role === "teacher",
    isStudent: role === "student",
    isParent: role === "parent",
  };
}