"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  CheckCheck,
  Phone,
  Video,
  Info,
  CheckCircle2,
} from "lucide-react";

type Message = {
  id: string;
  text: string;
  time: string;
  isOwn: boolean;
};

type Contact = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  history: Message[];
};

export default function MessagesClient({ contacts }: { contacts: Contact[] }) {
  const [activeContactId, setActiveContactId] = useState<string>(contacts[0]?.id);
  const [inputText, setInputText] = useState("");

  const activeContact = contacts.find((c) => c.id === activeContactId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    // Real app mein yahan API call hogi
    console.log("Sending message:", inputText);
    setInputText("");
  };

  return (
    <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ===== LEFT SIDEBAR: CONTACTS LIST ===== */}
      <div className="flex w-full flex-col border-r border-slate-200 bg-white md:w-80 lg:w-96 shrink-0">
        {/* Search Header */}
        <div className="border-b border-slate-100 p-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search messages..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => {
            const isActive = activeContactId === contact.id;
            return (
              <button
                key={contact.id}
                onClick={() => setActiveContactId(contact.id)}
                className={`flex w-full items-start gap-3 border-b border-slate-50 p-4 text-left transition-colors hover:bg-slate-50 focus:outline-none ${
                  isActive ? "bg-teal-50/50" : ""
                }`}
              >
                <div className="relative h-12 w-12 shrink-0">
                  <Image
                    src={contact.avatar}
                    alt={contact.name}
                    fill
                    unoptimized
                    className="rounded-full object-cover border border-slate-200"
                  />
                  {contact.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {contact.name}
                    </h3>
                    <span className="text-[11px] font-medium text-slate-400">
                      {contact.time}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-xs ${
                        contact.unread > 0 ? "font-semibold text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {contact.lastMessage}
                    </p>
                    {contact.unread > 0 && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== RIGHT SIDEBAR: CHAT WINDOW ===== */}
      {activeContact ? (
        <div className="hidden flex-1 flex-col bg-slate-50/30 md:flex">
          {/* Chat Header */}
          <div className="flex h-[73px] items-center justify-between border-b border-slate-200 bg-white px-6">
            <div className="flex items-center gap-3">
              <Image
                src={activeContact.avatar}
                alt={activeContact.name}
                width={40}
                height={40}
                unoptimized
                className="h-10 w-10 rounded-full object-cover border border-slate-200"
              />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {activeContact.name}
                </h2>
                <p className="text-xs text-slate-500 capitalize">
                  {activeContact.role}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-colors">
                <Phone className="h-4 w-4" />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-colors">
                <Video className="h-4 w-4" />
              </button>
              <div className="mx-1 h-5 w-px bg-slate-200" />
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex justify-center mb-6">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Today
              </span>
            </div>

            {activeContact.history.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}
              >
                <div
                  className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    msg.isOwn
                      ? "rounded-tr-sm bg-teal-600 text-white"
                      : "rounded-tl-sm border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {msg.text}
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-[10px] font-medium text-slate-400">{msg.time}</span>
                  {msg.isOwn && <CheckCircle2 className="h-3 w-3 text-teal-500" />}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 bg-white p-4">
            <form
              onSubmit={handleSend}
              className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10 transition-all"
            >
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Write a message..."
                className="max-h-32 min-h-[40px] w-full resize-none bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed m-0.5"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center bg-slate-50/50 md:flex flex-col gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Info className="h-8 w-8" />
          </div>
          <p className="text-sm font-medium text-slate-500">Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  );
}