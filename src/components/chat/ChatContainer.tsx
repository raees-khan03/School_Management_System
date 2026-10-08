"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Send,
  Check,
  CheckCheck,
  Trash2,
  Plus,
  X,
  MessageSquare,
  Loader2,
  Ban,
  MoreVertical,
  Pencil,
  Eraser,
  CheckCircle2,
} from "lucide-react";
import { pusherClient } from "@/lib/pusher-client";
import {
  sendMessage,
  editMessage,
  markMessagesAsRead,
  deleteMessage,
  getOrCreateConversation,
  clearChat,
  deleteConversation,
} from "@/lib/actions/chat";

export type ChatUser = {
  id: string;
  name: string;
  role: string;
  avatar: string;
};

export type SerializedMessage = {
  id: string;
  text: string;
  senderId: string;
  conversationId: string;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
};

export type SerializedConversation = {
  id: string;
  members: string[];
  otherUser: ChatUser;
  messages: SerializedMessage[];
  unreadCount: number;
  updatedAt: string;
};

type Props = {
  currentUserId: string;
  initialConversations: SerializedConversation[];
  allContacts: ChatUser[];
};

const formatTime = (dateInput?: string | Date) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function ChatContainer({
  currentUserId,
  initialConversations,
  allContacts,
}: Props) {
  const router = useRouter();
  const [conversations, setConversations] =
    useState<SerializedConversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string>(
    initialConversations[0]?.id || ""
  );

  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchContact, setSearchContact] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  // Edit message state
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConv = conversations.find((c) => c.id === activeId);

  // Keep conversations prop in sync when server revalidates
  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeId, activeConv?.messages.length]);

  useEffect(() => {
    if (!activeId) return;
    markMessagesAsRead(activeId);

    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
    );
  }, [activeId]);

  // ==================== REAL-TIME PUSHER LISTENERS ====================
  useEffect(() => {
    if (!activeId) return;

    const channelName = `chat-${activeId}`;
    const channel = pusherClient.subscribe(channelName);

    // 1. Incoming live message
    channel.bind("incoming-message", (newMsg: SerializedMessage) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            const exists = c.messages.some((m) => m.id === newMsg.id);
            const updatedMessages = exists
              ? c.messages.map((m) => (m.id === newMsg.id ? newMsg : m))
              : [...c.messages, newMsg];

            return {
              ...c,
              messages: updatedMessages,
              updatedAt: newMsg.createdAt,
            };
          }
          return c;
        })
      );

      if (newMsg.senderId !== currentUserId) {
        markMessagesAsRead(activeId);
      }
    });

    // 2. Real-time Blue Ticks (Read status)
    channel.bind("messages-read", () => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            return {
              ...c,
              messages: c.messages.map((m) => ({ ...m, isRead: true })),
            };
          }
          return c;
        })
      );
    });

    // 3. Real-time Message Updated (Edit)
    channel.bind("message-updated", (updatedMsg: SerializedMessage) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === updatedMsg.id ? updatedMsg : m
              ),
            };
          }
          return c;
        })
      );
    });

    // 4. Real-time Message Deleted
    channel.bind("message-deleted", ({ messageId }: { messageId: string }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId
                  ? { ...m, isDeleted: true, text: "This message was deleted" }
                  : m
              ),
            };
          }
          return c;
        })
      );
    });

    // 5. Clear Chat
    channel.bind("chat-cleared", () => {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, messages: [] } : c))
      );
    });

    // 6. Delete Conversation
    channel.bind("conversation-deleted", () => {
      setConversations((prev) => prev.filter((c) => c.id !== activeId));
      setActiveId("");
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [activeId, currentUserId]);

  // Send Message (with instant optimistic update so refresh is never needed)
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeId || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    const res = await sendMessage(activeId, text);
    setSending(false);

    if (res.success && res.message) {
      // Optimistic update
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            const exists = c.messages.some((m) => m.id === res.message.id);
            return {
              ...c,
              messages: exists ? c.messages : [...c.messages, res.message],
              updatedAt: res.message.createdAt,
            };
          }
          return c;
        })
      );
    } else {
      alert(res.error || "Failed to send message.");
    }
  };

  // Edit Message
  const handleEditSubmit = async (msgId: string) => {
    if (!editText.trim() || !activeId) return;

    const res = await editMessage(msgId, activeId, editText);
    if (res.success && res.message) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === msgId ? res.message : m
              ),
            };
          }
          return c;
        })
      );
      setEditingMsgId(null);
      setEditText("");
    } else {
      alert(res.error || "Could not edit message.");
    }
  };

  // Delete Message for Everyone
  const handleDeleteMessage = async (msgId: string) => {
    if (!activeId) return;
    if (confirm("Delete this message for everyone?")) {
      const res = await deleteMessage(msgId, activeId);
      if (res.success) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === msgId
                    ? { ...m, isDeleted: true, text: "This message was deleted" }
                    : m
                ),
              };
            }
            return c;
          })
        );
      } else {
        alert(res.error || "Could not delete message.");
      }
    }
  };

  // Clear All Messages in Chat
  const handleClearChat = async () => {
    if (!activeId) return;
    setHeaderMenuOpen(false);
    if (confirm("Are you sure you want to clear all messages in this chat?")) {
      const res = await clearChat(activeId);
      if (res.success) {
        setConversations((prev) =>
          prev.map((c) => (c.id === activeId ? { ...c, messages: [] } : c))
        );
      } else {
        alert(res.error || "Failed to clear chat.");
      }
    }
  };

  // Delete Entire Conversation
  const handleDeleteConversation = async () => {
    if (!activeId) return;
    setHeaderMenuOpen(false);
    if (confirm("Delete this conversation permanently?")) {
      const res = await deleteConversation(activeId);
      if (res.success) {
        setConversations((prev) => prev.filter((c) => c.id !== activeId));
        setActiveId("");
        router.refresh();
      } else {
        alert(res.error || "Failed to delete conversation.");
      }
    }
  };

  // Start New Chat from Modal
  const handleStartChat = async (targetUserId: string) => {
    setModalOpen(false);
    const res = await getOrCreateConversation(targetUserId);

    if (res.success && res.conversationId) {
      setActiveId(res.conversationId);
      router.refresh();
    } else {
      alert(res.error || "Could not open chat.");
    }
  };

  const filteredContacts = allContacts.filter((c) =>
    c.name.toLowerCase().includes(searchContact.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ================= LEFT CONVERSATION LIST ================= */}
      <div className="flex w-full flex-col border-r border-slate-200 bg-white md:w-80 lg:w-96 shrink-0">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="text-base font-semibold text-slate-900">Chats</h2>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const lastMsg = conv.messages[conv.messages.length - 1];

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => {
                  setActiveId(conv.id);
                  setHeaderMenuOpen(false);
                }}
                className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50 ${
                  isActive ? "bg-teal-50/60" : ""
                }`}
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  <Image
                    src={conv.otherUser.avatar || "/noAvatar.png"}
                    alt={conv.otherUser.name}
                    fill
                    sizes="44px"
                    unoptimized
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {conv.otherUser.name}
                    </h3>
                    {lastMsg && (
                      <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                        {formatTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-slate-500">
                      {lastMsg
                        ? lastMsg.isDeleted
                          ? "This message was deleted"
                          : lastMsg.text
                        : "No messages yet"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {conversations.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No conversations yet. Click &quot;New Chat&quot; to message someone.
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT CHAT WINDOW ================= */}
      {activeConv ? (
        <div className="hidden flex-1 flex-col bg-slate-50/40 md:flex">
          {/* Header */}
          <div className="relative flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                <Image
                  src={activeConv.otherUser.avatar || "/noAvatar.png"}
                  alt={activeConv.otherUser.name}
                  fill
                  sizes="40px"
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {activeConv.otherUser.name}
                </h3>
                <span className="inline-block rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 capitalize ring-1 ring-inset ring-teal-600/20">
                  {activeConv.otherUser.role}
                </span>
              </div>
            </div>

            {/* 3-Dots Header Options Menu (WhatsApp Style) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setHeaderMenuOpen((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {headerMenuOpen && (
                <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Eraser className="h-4 w-4 text-slate-400" />
                    Clear chat
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConversation}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                    Delete conversation
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div
            className="flex-1 overflow-y-auto p-6 space-y-4"
            onClick={() => setHeaderMenuOpen(false)}
          >
            {activeConv.messages.map((msg) => {
              const isOwn = msg.senderId === currentUserId;
              const isEditingThis = editingMsgId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`group flex flex-col ${
                    isOwn ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-2 max-w-[75%]">
                    {/* Action Icons on Hover for Own Messages */}
                    {isOwn && !msg.isDeleted && !isEditingThis && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMsgId(msg.id);
                            setEditText(msg.text);
                          }}
                          className="p-1 text-slate-400 hover:text-teal-600"
                          title="Edit message"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                          title="Delete for everyone"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Inline Editing View */}
                    {isEditingThis ? (
                      <div className="flex items-center gap-1.5 w-full bg-white p-2 rounded-xl border border-teal-500 shadow-sm">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 text-xs text-slate-900 outline-none px-2 py-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditSubmit(msg.id);
                            if (e.key === "Escape") setEditingMsgId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleEditSubmit(msg.id)}
                          className="p-1 text-teal-600 hover:bg-teal-50 rounded-lg"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMsgId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      /* Message Bubble */
                      <div
                        className={`relative rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          msg.isDeleted
                            ? "bg-slate-100 text-slate-400 italic"
                            : isOwn
                            ? "bg-teal-600 text-white rounded-tr-xs"
                            : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                        }`}
                      >
                        {msg.isDeleted ? (
                          <span className="flex items-center gap-1.5">
                            <Ban className="h-3.5 w-3.5" />
                            This message was deleted
                          </span>
                        ) : (
                          msg.text
                        )}
                      </div>
                    )}
                  </div>

                  {/* Time & Blue Ticks */}
                  <div className="mt-1 flex items-center gap-1 px-1">
                    <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                      {formatTime(msg.createdAt)}
                    </span>

                    {/* WHATSAPP TICKS FOR SENT MESSAGES */}
                    {isOwn && !msg.isDeleted && (
                      <span className="ml-0.5">
                        {msg.isRead ? (
                          // Double Teal Check (Read)
                          <CheckCheck className="h-3.5 w-3.5 text-teal-600" />
                        ) : (
                          // Single Gray Check (Sent)
                          <Check className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <div className="border-t border-slate-200 bg-white p-4">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center bg-slate-50/50 md:flex">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            Select a conversation
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Choose a contact on the left or start a new chat.
          </p>
        </div>
      )}

      {/* NEW CHAT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">Start New Chat</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                placeholder="Search user by name..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              />
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleStartChat(contact.id)}
                  className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-slate-50 rounded-xl"
                >
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    <Image
                      src={contact.avatar || "/noAvatar.png"}
                      alt={contact.name}
                      fill
                      sizes="36px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {contact.name}
                    </p>
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      {contact.role}
                    </span>
                  </div>
                </button>
              ))}

              {filteredContacts.length === 0 && (
                <p className="p-4 text-center text-xs text-slate-400">
                  No users found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}