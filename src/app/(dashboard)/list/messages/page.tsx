import { getAuthUser } from "@/lib/getRole";
import prisma from "@/lib/prisma";
import ChatContainer, {
  type ChatUser,
  type SerializedConversation,
} from "@/components/chat/ChatContainer";

export default async function MessagesPage() {
  const { userId, role } = await getAuthUser();

  if (!userId) {
    return (
      <div className="w-full p-6 text-center text-sm text-slate-500">
        Please sign in to access messages.
      </div>
    );
  }

  // 1. Fetch Conversations where current user is a member
  const rawConversations = await prisma.conversation.findMany({
    where: {
      members: { has: userId },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Collect all unique user IDs that the logged-in user is chatting with
  const otherUserIds = Array.from(
    new Set(
      rawConversations.flatMap((c) => c.members).filter((mId) => mId !== userId)
    )
  );

  // 2. Fetch Users from DB (Teachers, Students, Parents, Admins) for contact details
  const [teachers, students, parents, admins] = await Promise.all([
    prisma.teacher.findMany({ select: { id: true, name: true, surname: true, img: true } }),
    prisma.student.findMany({ select: { id: true, name: true, surname: true, img: true } }),
    prisma.parent.findMany({ select: { id: true, name: true, surname: true } }),
    prisma.admin.findMany({ select: { id: true, username: true } }),
  ]);

  // Build a lookup map of all users in the system
  const userMap = new Map<string, ChatUser>();

  teachers.forEach((t) =>
    userMap.set(t.id, { id: t.id, name: `${t.name} ${t.surname}`, role: "teacher", avatar: t.img || "/noAvatar.png" })
  );
  students.forEach((s) =>
    userMap.set(s.id, { id: s.id, name: `${s.name} ${s.surname}`, role: "student", avatar: s.img || "/noAvatar.png" })
  );
  parents.forEach((p) =>
    userMap.set(p.id, { id: p.id, name: `${p.name} ${p.surname}`, role: "parent", avatar: "/noAvatar.png" })
  );
  admins.forEach((a) =>
    userMap.set(a.id, { id: a.id, name: a.username, role: "admin", avatar: "/noAvatar.png" })
  );

  // 3. Format Conversations for Client Component
  const initialConversations: SerializedConversation[] = rawConversations.map((c) => {
    const otherId = c.members.find((mId) => mId !== userId) || "";
    const otherUser = userMap.get(otherId) || {
      id: otherId,
      name: "Unknown User",
      role: "user",
      avatar: "/noAvatar.png",
    };

    const unreadCount = c.messages.filter(
      (m) => m.senderId !== userId && !m.isRead
    ).length;

    return {
      id: c.id,
      members: c.members,
      otherUser,
      messages: JSON.parse(JSON.stringify(c.messages)),
      unreadCount,
      updatedAt: c.updatedAt.toISOString(),
    };
  });

  // 4. Contacts list for Starting New Chats (Exclude current user)
  const allContacts: ChatUser[] = Array.from(userMap.values()).filter(
    (u) => u.id !== userId
  );

  return (
    <div className="w-full p-4 md:p-6 flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-slate-900">
          Messages
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Real-time messaging with teachers, students, parents, and admins.
        </p>
      </div>

      <ChatContainer
        currentUserId={userId}
        initialConversations={initialConversations}
        allContacts={allContacts}
      />
    </div>
  );
}