import {
  LayoutDashboard,
  Presentation,
  GraduationCap,
  Users,
  BookOpen,
  Library,
  ClipboardList,
  FileText,
  PenTool,
  Award,
  CalendarCheck,
  Wallet,
  Receipt, // 👈 1. Receipt Icon Import Hua
  CalendarDays,
  MessageSquare,
  Megaphone,
  User,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type Role = "admin" | "teacher" | "student" | "parent";

export type MenuItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  visible: Role[];
};

export type MenuSection = {
  title: string;
  items: MenuItem[];
};

export const menuItems: MenuSection[] = [
  {
    title: "MAIN MENU",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/", visible: ["admin", "teacher", "student", "parent"] },
      { icon: Presentation, label: "Teachers", href: "/list/teachers", visible: ["admin"] },
      { icon: GraduationCap, label: "Students", href: "/list/students", visible: ["admin", "teacher"] },
      { icon: Users, label: "Parents", href: "/list/parents", visible: ["admin"] },
      { icon: BookOpen, label: "Subjects", href: "/list/subjects", visible: ["admin"] },
      { icon: Library, label: "Classes", href: "/list/classes", visible: ["admin", "teacher"] },
      { icon: ClipboardList, label: "Lessons", href: "/list/lessons", visible: ["admin", "teacher"] },
      { icon: FileText, label: "Exams", href: "/list/exams", visible: ["admin", "teacher", "student", "parent"] },
      { icon: PenTool, label: "Assignments", href: "/list/assignments", visible: ["admin", "teacher", "student", "parent"] },
      { icon: Award, label: "Results", href: "/list/results", visible: ["admin", "teacher", "student", "parent"] },
      { icon: CalendarCheck, label: "Attendance", href: "/list/attendance", visible: ["admin", "teacher", "student", "parent"] },
      { icon: Wallet, label: "Finance", href: "/list/finance", visible: ["admin"] },
      
      // 👈 2. Collect Fees Ka Naya Option Add Ho Gaya (Sirf Admin Ko Dikhega)
      { icon: Receipt, label: "Collect Fees", href: "/fees", visible: ["admin"] },
      
      { icon: CalendarDays, label: "Events", href: "/list/events", visible: ["admin", "teacher", "student", "parent"] },
      { icon: MessageSquare, label: "Messages", href: "/list/messages", visible: ["admin", "teacher", "student", "parent"] },
      { icon: Megaphone, label: "Announcements", href: "/list/announcements", visible: ["admin", "teacher", "student", "parent"] },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { icon: User, label: "Profile", href: "/profile", visible: ["admin", "teacher", "student", "parent"] },
      { icon: Settings, label: "Settings", href: "/settings", visible: ["admin", "teacher", "student", "parent"] },
    ],
  },
];