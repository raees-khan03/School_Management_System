import Image from "next/image";
import NavLink from "./NavLink";
import { getRole } from "@/lib/getRole";

const menuItems = [
  {
    title: "MAIN MENU",
    items: [
      { icon: "/home.png", label: "Dashboard", href: "/", visible: ["admin", "teacher", "student", "parent"] },
      { icon: "/teacher.png", label: "Teachers", href: "/list/teachers", visible: ["admin", "teacher"] },
      { icon: "/student.png", label: "Students", href: "/list/students", visible: ["admin", "teacher"] },
      { icon: "/parent.png", label: "Parents", href: "/list/parents", visible: ["admin", "teacher"] },
      { icon: "/subject.png", label: "Subjects", href: "/list/subjects", visible: ["admin"] },
      { icon: "/class.png", label: "Classes", href: "/list/classes", visible: ["admin", "teacher"] },
      { icon: "/lesson.png", label: "Lessons", href: "/list/lessons", visible: ["admin", "teacher"] },
      { icon: "/exam.png", label: "Exams", href: "/list/exams", visible: ["admin", "teacher", "student", "parent"] },
      { icon: "/assignment.png", label: "Assignments", href: "/list/assignments", visible: ["admin", "teacher", "student", "parent"] },
      { icon: "/result.png", label: "Results", href: "/list/results", visible: ["admin", "teacher", "student", "parent"] },
      { icon: "/attendance.png", label: "Attendance", href: "/list/attendance", visible: ["admin", "teacher", "student", "parent"] },
      { icon: "/calendar.png", label: "Events", href: "/list/events", visible: ["admin", "teacher", "student", "parent"] },
      { icon: "/message.png", label: "Messages", href: "/list/messages", visible: ["admin", "teacher", "student", "parent"] },
      { icon: "/announcement.png", label: "Announcements", href: "/list/announcements", visible: ["admin", "teacher", "student", "parent"] },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { icon: "/profile.png", label: "Profile", href: "/profile", visible: ["admin", "teacher", "student", "parent"] },
      { icon: "/setting.png", label: "Settings", href: "/settings", visible: ["admin", "teacher", "student", "parent"] },
    ],
  },
];

export default async function Menu() {
  const role = await getRole();

  return (
    <div className="mt-4 text-sm px-3">
      {menuItems.map((section, idx) => (
        <div key={section.title} className="flex flex-col gap-1 mb-6">
          <span className="hidden lg:block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
            {section.title}
          </span>
          {section.items.map((item) => {
            if (role && item.visible.includes(role)) {
              return (
                <NavLink href={item.href} key={item.label}>
                  <div className="flex items-center justify-center w-6 h-6 shrink-0">
                    <Image
                      src={item.icon}
                      alt={item.label}
                      width={18}
                      height={18}
                      className="opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <span className="hidden lg:block">{item.label}</span>
                </NavLink>
              );
            }
            return null;
          })}

          {idx < menuItems.length - 1 && (
            <div className="hidden lg:block border-t border-slate-100 mt-4 mx-3" />
          )}
        </div>
      ))}
    </div>
  );
}