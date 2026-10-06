import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@/types/globals";

/**
 * Logged-in user ka role get karne ke liye helper function.
 * Sirf Server Components, Server Actions, aur API Routes mein chalega.
 */
export async function getRole(): Promise<UserRole | null> {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role || null;
}

/**
 * User ID aur Role dono ek saath get karne ke liye helper function.
 */
export async function getAuthUser() {
  const { userId, sessionClaims } = await auth();
  return {
    userId,
    role: sessionClaims?.metadata?.role || null,
  };
}