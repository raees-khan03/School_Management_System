import { Prisma } from "@prisma/client";

// ===== BASIC TYPES — SEEDHA PRISMA SE =====
// Yeh Prisma khud generate karta hai, hume likhne ki zaroorat nahi
export type Teacher = Prisma.TeacherGetPayload<{}>;
export type Student = Prisma.StudentGetPayload<{}>;
export type Parent = Prisma.ParentGetPayload<{}>;
export type Class = Prisma.ClassGetPayload<{}>;
export type Subject = Prisma.SubjectGetPayload<{}>;
export type Lesson = Prisma.LessonGetPayload<{}>;
export type Exam = Prisma.ExamGetPayload<{}>;
export type Assignment = Prisma.AssignmentGetPayload<{}>;
export type Result = Prisma.ResultGetPayload<{}>;
export type Attendance = Prisma.AttendanceGetPayload<{}>;
export type Event = Prisma.EventGetPayload<{}>;
export type Announcement = Prisma.AnnouncementGetPayload<{}>;
export type Grade = Prisma.GradeGetPayload<{}>;
export type Admin = Prisma.AdminGetPayload<{}>;

// ===== RELATIONS KE SATH TYPES (jab "include" use karein) =====

// Teacher + uske Subjects aur Classes
export type TeacherWithRelations = Prisma.TeacherGetPayload<{
  include: { subjects: true; classes: true };
}>;

// Student + uski Class, Grade, Parent
export type StudentWithRelations = Prisma.StudentGetPayload<{
  include: { class: true; grade: true; parent: true };
}>;

// Parent + uske Students
export type ParentWithRelations = Prisma.ParentGetPayload<{
  include: { students: true };
}>;

// Class + Grade, Supervisor(Teacher)
export type ClassWithRelations = Prisma.ClassGetPayload<{
  include: { grade: true; supervisor: true };
}>;

// Subject + uske Teachers
export type SubjectWithRelations = Prisma.SubjectGetPayload<{
  include: { teachers: true };
}>;

// Lesson + Subject, Class, Teacher
export type LessonWithRelations = Prisma.LessonGetPayload<{
  include: { subject: true; class: true; teacher: true };
}>;

// Exam + Lesson (aur Lesson ke andar Subject bhi)
export type ExamWithRelations = Prisma.ExamGetPayload<{
  include: { lesson: { include: { subject: true; class: true; teacher: true } } };
}>;

// Result + Student, Exam, Assignment
export type ResultWithRelations = Prisma.ResultGetPayload<{
  include: { student: true; exam: true; assignment: true };
}>;

// Event + Class
export type EventWithRelations = Prisma.EventGetPayload<{
  include: { class: true };
}>;

// Announcement + Class
export type AnnouncementWithRelations = Prisma.AnnouncementGetPayload<{
  include: { class: true };
}>;
export type TableType = | "teacher" | "student" | ... | "finance";