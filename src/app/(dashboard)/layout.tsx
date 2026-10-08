import { getRole } from "@/lib/getRole";
import DashboardShell from "@/components/DashboardShell";
import Navbar from "@/components/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Clerk se user ka role get karein
  const role = await getRole();

  return (
    <DashboardShell role={role} >
      {children}
    </DashboardShell>
  );
}