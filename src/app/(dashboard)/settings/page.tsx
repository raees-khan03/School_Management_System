import { currentUser } from "@clerk/nextjs/server";
import { getAuthUser } from "@/lib/getRole";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  const clerkUser = await currentUser();
  const { userId, role } = await getAuthUser();

  if (!clerkUser || !userId) {
    redirect("/");
  }

  const userData = {
    id: clerkUser.id,
    fullName:
      clerkUser.fullName ||
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
    firstName: clerkUser.firstName || "",
    lastName: clerkUser.lastName || "",
    email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
    imageUrl: clerkUser.imageUrl || "",
    username: clerkUser.username || "",
    role: role || "user",
  };

  return (
    <div className="w-full p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 lg:text-2xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account, security, and preferences.
        </p>
      </div>
  
      <SettingsClient user={userData} />
    </div>
  );
}