const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Aapke Student ki ID
  const studentId = "user_3KJoMPqRjWEAvMnwQ6XKNEsAntm";

  console.log(`Starting data generation for Student: ${studentId}...`);

  // 1. Verify Student Exists
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true },
  });

  if (!student) {
    console.error("❌ Student not found in database!");
    return;
  }

  if (!student.classId) {
    console.error("❌ Student does not belong to any class. Please assign a class first.");
    return;
  }

  console.log(`✅ Student found: ${student.name} ${student.surname}`);

  // 2. Teacher Find (Pehela teacher uthayen)
  const teacher = await prisma.teacher.findFirst();
  if (!teacher) {
    console.error("❌ No teacher found in DB to assign subjects!");
    return;
  }

  // 3. Subjects Create / Connect Karein
  const subjectsData = ["Mathematics", "Physics", "Computer Science", "English"];

  for (const subName of subjectsData) {
    let subject = await prisma.subject.findUnique({ where: { name: subName } });
    if (!subject) {
      subject = await prisma.subject.create({
        data: { name: subName, teachers: { connect: { id: teacher.id } } },
      });
      console.log(`- Created Subject: ${subName}`);
    }

    // 4. Lesson Create Karein
    let lesson = await prisma.lesson.findFirst({
      where: { subjectId: subject.id, classId: student.classId },
    });

    if (!lesson) {
      lesson = await prisma.lesson.create({
        data: {
          name: `${subName} Class`,
          day: "MONDAY",
          startTime: new Date(new Date().setHours(9, 0, 0, 0)),
          endTime: new Date(new Date().setHours(10, 0, 0, 0)),
          subjectId: subject.id,
          classId: student.classId,
          teacherId: teacher.id,
        },
      });
      console.log(`- Created Lesson for ${subName}`);
    }

    // 5. Exam Create Karein
    const exam = await prisma.exam.create({
      data: {
        title: `${subName} Final Exam`,
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
        lessonId: lesson.id,
      },
    });
    console.log(`- Created Exam for ${subName}`);

    // 6. Student ka Random High Result Add Karein (70 se 98 ke beech)
    const randomScore = Math.floor(Math.random() * (98 - 70 + 1)) + 70;

    await prisma.result.create({
      data: {
        score: randomScore,
        studentId: student.id,
        examId: exam.id,
      },
    });
    console.log(`✅ Result added for ${subName}: Marks ${randomScore}/100`);
  }

  console.log("\n🎉 All data generated successfully for the Report Card!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });