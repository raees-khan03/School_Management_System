import MenuPage from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-[14%] md:w-[8%] lg:w-[16%] border-2 p-4 h-screen overflow-y-auto">
        <Link
          href={"/"}
          className="flex items-center justify-center gap-2 lg:justify-start"
        >
          <Image src={"/logo.png"} alt="logo" height={32} width={32} />
          <span className="hidden lg:block">SchoolMS</span>
        </Link>
        <MenuPage />
      </div>

      {/* Main content */}
      <div className="w-[86%] md:w-[92%] lg:w-[84%] border-2 bg-[#F7F8FA] h-screen overflow-y-auto">
        <Navbar />
        {children}
      </div>
    </div>
  );
}