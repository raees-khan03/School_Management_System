import { Day, PrismaClient, UserSex } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ===== GRADES =====
  
  const grades = [1, 2, 3, 4, 5, 6];
  for (const level of grades) {
    await prisma.grade.create({ data: { level } });
  }

  // ===== SUBJECTS =====
  const subjects = [
    "Math",
    "English",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Art",
    "Music",
    "Literature",
  ];
  const createdSubjects = [];
  for (const name of subjects) {
    const subject = await prisma.subject.create({ data: { name } });
    createdSubjects.push(subject);
  }

  // ===== TEACHERS =====
  const teachersData = [
    {
      name: "John",
      surname: "Doe",
      email: "john.doe@school.com",
      phone: "0300-1234567",
      address: "123 Main St, Lahore",
      bloodType: "A+",
      sex: UserSex.MALE,
      subjectNames: ["Math", "Geography"],
    },
    {
      name: "Jane",
      surname: "Smith",
      email: "jane.smith@school.com",
      phone: "0301-2345678",
      address: "45 Garden Town, Lahore",
      bloodType: "B+",
      sex: UserSex.FEMALE,
      subjectNames: ["Physics", "Chemistry"],
    },
    {
      name: "Mike",
      surname: "Geller",
      email: "mike.geller@school.com",
      phone: "0302-3456789",
      address: "67 Model Town, Lahore",
      bloodType: "O+",
      sex: UserSex.MALE,
      subjectNames: ["Biology"],
    },
    {
      name: "Allen",
      surname: "Black",
      email: "allen.black@school.com",
      phone: "0303-4567890",
      address: "89 DHA Phase 5, Lahore",
      bloodType: "AB+",
      sex: UserSex.MALE,
      subjectNames: ["English", "Literature"],
    },
    {
      name: "Anna",
      surname: "Santiago",
      email: "anna.santiago@school.com",
      phone: "0304-5678901",
      address: "12 Johar Town, Lahore",
      bloodType: "A-",
      sex: UserSex.FEMALE,
      subjectNames: ["History", "Art"],
    },
    {
      name: "Derek",
      surname: "Briggs",
      email: "derek.briggs@school.com",
      phone: "0305-6789012",
      address: "34 Wapda Town, Lahore",
      bloodType: "O-",
      sex: UserSex.MALE,
      subjectNames: ["Music"],
    },
  ];

  const createdTeachers = [];
  for (const t of teachersData) {
    const matchedSubjects = createdSubjects.filter((s) =>
      t.subjectNames.includes(s.name)
    );
    const teacher = await prisma.teacher.create({
      data: {
        username: `${t.name.toLowerCase()}.${t.surname.toLowerCase()}`,
        name: t.name,
        surname: t.surname,
        email: t.email,
        phone: t.phone,
        address: t.address,
        bloodType: t.bloodType,
        sex: t.sex,
        birthday: new Date(1985, 4, 12),
        subjects: {
          connect: matchedSubjects.map((s) => ({ id: s.id })),
        },
      },
    });
    createdTeachers.push(teacher);
  }

  // ===== CLASSES =====
  const classNames = ["1A", "2A", "3A", "4A", "5A", "6A"];
  const createdClasses = [];
  for (let i = 0; i < classNames.length; i++) {
    const cls = await prisma.class.create({
      data: {
        name: classNames[i],
        capacity: 25,
        gradeId: i + 1,
        supervisorId: createdTeachers[i % createdTeachers.length].id,
      },
    });
    createdClasses.push(cls);
  }

  // ===== LESSONS =====
  const dayList: Day[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const createdLessons = [];
  for (let i = 0; i < createdSubjects.length; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        name: `${createdSubjects[i].name} Lesson`,
        day: dayList[i % dayList.length],
        startTime: new Date(new Date().setHours(8 + i, 0, 0)),
        endTime: new Date(new Date().setHours(8 + i, 45, 0)),
        subjectId: createdSubjects[i].id,
        classId: createdClasses[i % createdClasses.length].id,
        teacherId: createdTeachers[i % createdTeachers.length].id,
      },
    });
    createdLessons.push(lesson);
  }

  // ===== PARENTS =====
  const parentsData = [
    {
      name: "Robert",
      surname: "Brewer",
      email: "robert.brewer@gmail.com",
      phone: "0311-1111111",
      address: "56 Cantt, Lahore",
    },
    {
      name: "Linda",
      surname: "Bradley",
      email: "linda.bradley@gmail.com",
      phone: "0312-2222222",
      address: "78 Faisal Town, Lahore",
    },
    {
      name: "Thomas",
      surname: "Caldwell",
      email: "thomas.caldwell@gmail.com",
      phone: "0313-3333333",
      address: "90 Iqbal Town, Lahore",
    },
    {
      name: "Susan",
      surname: "Fitzgerald",
      email: "susan.fitzgerald@gmail.com",
      phone: "0314-4444444",
      address: "23 Township, Lahore",
    },
    {
      name: "Michael",
      surname: "Harvey",
      email: "michael.harvey@gmail.com",
      phone: "0315-5555555",
      address: "11 Gulberg, Lahore",
    },
  ];

  const createdParents = [];
  for (const p of parentsData) {
    const parent = await prisma.parent.create({
      data: {
        username: `${p.name.toLowerCase()}.${p.surname.toLowerCase()}`,
        name: p.name,
        surname: p.surname,
        email: p.email,
        phone: p.phone,
        address: p.address,
      },
    });
    createdParents.push(parent);
  }

  // ===== STUDENTS =====
  const studentsData = [
    { name: "Sarah", surname: "Brewer", sex: UserSex.FEMALE },
    { name: "Cecilia", surname: "Bradley", sex: UserSex.FEMALE },
    { name: "Fanny", surname: "Caldwell", sex: UserSex.FEMALE },
    { name: "Mollie", surname: "Fitzgerald", sex: UserSex.FEMALE },
    { name: "Ian", surname: "Bryant", sex: UserSex.MALE },
    { name: "Mable", surname: "Harvey", sex: UserSex.FEMALE },
    { name: "Joel", surname: "Lambert", sex: UserSex.MALE },
    { name: "Carrie", surname: "Tucker", sex: UserSex.FEMALE },
    { name: "Lilly", surname: "Underwood", sex: UserSex.FEMALE },
    { name: "Alexander", surname: "Blair", sex: UserSex.MALE },
  ];

  const createdStudents = [];
  for (let i = 0; i < studentsData.length; i++) {
    const s = studentsData[i];
    const student = await prisma.student.create({
      data: {
        username: `${s.name.toLowerCase()}.${s.surname.toLowerCase()}`,
        name: s.name,
        surname: s.surname,
        email: `${s.name.toLowerCase()}.${s.surname.toLowerCase()}@school.com`,
        phone: `032${i}-${1000000 + i}`,
        address: `${10 + i} Street, Lahore`,
        bloodType: "O+",
        sex: s.sex,
        birthday: new Date(2012, i % 12, (i % 28) + 1),
        parentId: createdParents[i % createdParents.length].id,
        classId: createdClasses[i % createdClasses.length].id,
        gradeId: (i % 6) + 1,
      },
    });
    createdStudents.push(student);
  }

  // ===== EXAMS =====
  const examTitles = ["Midterm Exam", "Final Exam", "Quiz 1", "Quiz 2"];
  const createdExams = [];
  for (let i = 0; i < createdLessons.length; i++) {
    const exam = await prisma.exam.create({
      data: {
        title: examTitles[i % examTitles.length],
        startTime: new Date(new Date().setHours(9, 0, 0)),
        endTime: new Date(new Date().setHours(11, 0, 0)),
        lessonId: createdLessons[i].id,
      },
    });
    createdExams.push(exam);
  }

  // ===== ASSIGNMENTS =====
  for (let i = 0; i < createdLessons.length; i++) {
    await prisma.assignment.create({
      data: {
        title: `${createdLessons[i].name} Homework`,
        startDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        lessonId: createdLessons[i].id,
      },
    });
  }

  // ===== RESULTS =====
  for (let i = 0; i < createdStudents.length; i++) {
    await prisma.result.create({
      data: {
        score: 70 + ((i * 3) % 30), // 70-99 ke beech random-jaisa score
        studentId: createdStudents[i].id,
        examId: createdExams[i % createdExams.length].id,
      },
    });
  }

  // ===== ATTENDANCE =====
  for (let i = 0; i < createdStudents.length; i++) {
    await prisma.attendance.create({
      data: {
        date: new Date(),
        present: i % 5 !== 0, // har 5th student ko absent dikhaya
        studentId: createdStudents[i].id,
        lessonId: createdLessons[i % createdLessons.length].id,
      },
    });
  }

  // ===== EVENTS =====
  const eventTitles = [
    "Lake Trip",
    "Picnic",
    "Beach Trip",
    "Museum Trip",
    "Music Concert",
  ];
  for (let i = 0; i < eventTitles.length; i++) {
    await prisma.event.create({
      data: {
        title: eventTitles[i],
        description: `${eventTitles[i]} organized for the class.`,
        classId: createdClasses[i % createdClasses.length].id,
        startTime: new Date(),
        endTime: new Date(new Date().setHours(new Date().getHours() + 2)),
      },
    });
  }

  // ===== ANNOUNCEMENTS =====
  const announcementTitles = [
    "About Math Test",
    "Field Trip Rescheduled",
    "Sports Day Update",
    "Parent-Teacher Meeting",
    "Annual Exam Schedule",
  ];
  for (let i = 0; i < announcementTitles.length; i++) {
    await prisma.announcement.create({
      data: {
        title: announcementTitles[i],
        description: `Details regarding: ${announcementTitles[i]}`,
        classId: createdClasses[i % createdClasses.length].id,
        date: new Date(),
      },
    });
  }

  console.log("✅ Seeding completed with real sample data!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });