import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { Building2, Lock } from "lucide-react";

export default async function SignInPage() {
  const user = await currentUser();

  if (user) {
    const role = user.publicMetadata?.role as string | undefined;
    if (role) redirect(`/${role}`);
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-white">
      {/* ================= LEFT SIDE — Branding ================= */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-slate-950 text-white p-12 xl:p-16">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] rounded-full bg-cyan-500/15 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        {/* Top brand logo */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 shadow-lg shadow-teal-500/20">
            <Building2 className="h-5 w-5 text-white" />
          </span>
          <span className="text-xl font-bold tracking-tight text-white">
            CampusPulse
          </span>
        </div>

        {/* Center Hero Copy */}
        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-medium text-teal-300 mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Next-Gen Campus Platform
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.15]">
            Run your campus
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300">
              smarter & simpler
            </span>
          </h1>

          <p className="mt-5 text-sm text-slate-300 leading-relaxed">
            One unified platform for admins, faculty, students, and parents.
            Attendance, schedules, exams, results, and messaging — all in real-time.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              "Role-based access",
              "Real-time attendance",
              "Live chat & updates",
              "Exam schedules",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
            {[
              { value: "4", label: "User roles" },
              { value: "12+", label: "Modules" },
              { value: "100%", label: "Secure" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white tabular-nums">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} CampusPulse</p>
          <p className="flex items-center gap-1.5 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            Enterprise-grade security
          </p>
        </div>
      </div>

      {/* ================= RIGHT SIDE — Form ================= */}
      <div className="flex flex-col justify-center items-center px-6 py-12 sm:px-10 lg:px-16 bg-slate-50 relative">
        {/* Mobile brand (small screens) */}
        <div className="lg:hidden flex items-center gap-3 mb-8 self-start sm:self-center">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 shadow-md shadow-teal-500/20">
            <Building2 className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            CampusPulse
          </span>
        </div>

        <div className="relative z-10 w-full flex justify-center">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}