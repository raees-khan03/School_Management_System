"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getRole";
import { pusherServer } from "@/lib/pusher-server";

// ==================== 1. GET OR CREATE CONVERSATION ====================
export async function getOrCreateConversation(targetUserId: string) {
  try {
    const { userId: currentUserId } = await getAuthUser();
    if (!currentUserId) return { success: false, error: "Unauthorized" };

    if (currentUserId === targetUserId) {
      return { success: false, error: "You cannot message yourself." };
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { members: { has: currentUserId } },
          { members: { has: targetUserId } },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          members: [currentUserId, targetUserId],
        },
      });
    }

    revalidatePath("/list/messages");
    return { success: true, conversationId: conversation.id };
  } catch (err: any) {
    console.error("getOrCreateConversation Error:", err);
    return { success: false, error: err?.message || "Failed to start chat." };
  }
}

// ==================== 2. SEND MESSAGE ====================
export async function sendMessage(conversationId: string, text: string) {
  try {
    const { userId: currentUserId } = await getAuthUser();
    if (!currentUserId) return { success: false, error: "Unauthorized" };

    const cleanText = text.trim();
    if (!cleanText) return { success: false, error: "Message cannot be empty." };

    const message = await prisma.message.create({
      data: {
        text: cleanText,
        senderId: currentUserId,
        conversationId,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const serializedMessage = JSON.parse(JSON.stringify(message));

    // Real-time broadcast
    await pusherServer.trigger(
      `chat-${conversationId}`,
      "incoming-message",
      serializedMessage
    );

    return { success: true, message: serializedMessage };
  } catch (err: any) {
    console.error("sendMessage Error:", err);
    return { success: false, error: err?.message || "Failed to send message." };
  }
}

// ==================== 3. EDIT MESSAGE (WHATSAPP STYLE) ====================
export async function editMessage(
  messageId: string,
  conversationId: string,
  newText: string
) {
  try {
    const { userId: currentUserId } = await getAuthUser();
    if (!currentUserId) return { success: false, error: "Unauthorized" };

    const cleanText = newText.trim();
    if (!cleanText) return { success: false, error: "Text cannot be empty." };

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.senderId !== currentUserId) {
      return { success: false, error: "You can only edit your own messages." };
    }

    if (message.isDeleted) {
      return { success: false, error: "Deleted messages cannot be edited." };
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { text: cleanText },
    });

    const serialized = JSON.parse(JSON.stringify(updatedMessage));

    // Broadcast update via Pusher
    await pusherServer.trigger(
      `chat-${conversationId}`,
      "message-updated",
      serialized
    );

    return { success: true, message: serialized };
  } catch (err: any) {
    console.error("editMessage Error:", err);
    return { success: false, error: err?.message || "Failed to edit message." };
  }
}

// ==================== 4. MARK MESSAGES AS READ ====================
export async function markMessagesAsRead(conversationId: string) {
  try {
    const { userId: currentUserId } = await getAuthUser();
    if (!currentUserId) return { success: false, error: "Unauthorized" };

    const updated = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: currentUserId },
        isRead: false,
      },
      data: { isRead: true },
    });

    if (updated.count > 0) {
      await pusherServer.trigger(
        `chat-${conversationId}`,
        "messages-read",
        { readerId: currentUserId }
      );
    }

    return { success: true };
  } catch (err: any) {
    console.error("markMessagesAsRead Error:", err);
    return { success: false, error: err?.message || "Failed to mark read." };
  }
}

// ==================== 5. DELETE MESSAGE (FOR EVERYONE) ====================
export async function deleteMessage(messageId: string, conversationId: string) {
  try {
    const { userId: currentUserId } = await getAuthUser();
    if (!currentUserId) return { success: false, error: "Unauthorized" };

    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage || existingMessage.senderId !== currentUserId) {
      return { success: false, error: "You can only delete your own messages." };
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        text: "This message was deleted",
      },
    });

    await pusherServer.trigger(
      `chat-${conversationId}`,
      "message-deleted",
      { messageId }
    );

    return { success: true };
  } catch (err: any) {
    console.error("deleteMessage Error:", err);
    return { success: false, error: err?.message || "Failed to delete message." };
  }
}

// ==================== 6. CLEAR CHAT ====================
export async function clearChat(conversationId: string) {
  try {
    const { userId: currentUserId } = await getAuthUser();
    if (!currentUserId) return { success: false, error: "Unauthorized" };

    await prisma.message.deleteMany({
      where: { conversationId },
    });

    await pusherServer.trigger(
      `chat-${conversationId}`,
      "chat-cleared",
      { conversationId }
    );

    revalidatePath("/list/messages");
    return { success: true };
  } catch (err: any) {
    console.error("clearChat Error:", err);
    return { success: false, error: err?.message || "Failed to clear chat." };
  }
}

// ==================== 7. DELETE CONVERSATION ====================
export async function deleteConversation(conversationId: string) {
  try {
    const { userId: currentUserId } = await getAuthUser();
    if (!currentUserId) return { success: false, error: "Unauthorized" };

    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    await pusherServer.trigger(
      `chat-${conversationId}`,
      "conversation-deleted",
      { conversationId }
    );

    revalidatePath("/list/messages");
    return { success: true };
  } catch (err: any) {
    console.error("deleteConversation Error:", err);
    return { success: false, error: err?.message || "Failed to delete conversation." };
  }
}