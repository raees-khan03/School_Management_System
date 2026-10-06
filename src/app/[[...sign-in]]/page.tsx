import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export default async function SignInPage() {
  const user = await currentUser();

  if (user) {
    const role = user.publicMetadata?.role as string | undefined;
    if (role) redirect(`/${role}`);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Soft background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-violet-100/50 blur-3xl" />
      </div>

      <div className="relative z-10 w-full flex justify-center">
        <LoginForm />
      </div>
    </div>
  );
}