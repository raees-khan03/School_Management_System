import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CampusPulse — Modern Campus Management Platform",
  description: "Enterprise campus management system for admins, teachers, students, and parents.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="antialiased">
        <body className={`${inter.className} bg-slate-50 text-slate-900`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}