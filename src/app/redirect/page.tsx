import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RedirectPage() {
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;

  if (!user) redirect("/");
  if (role) redirect(`/${role}`);

  redirect("/");
}