"use client";

import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Image from "next/image";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

type EventItem = {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  class?: { name: string } | null;
};

const EventCalendar = ({ events = [] }: { events?: EventItem[] }) => {
  const [value, onChange] = useState<Value>(new Date());

  const formatTime = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
    return `${s.toLocaleTimeString("en-US", opts)} - ${e.toLocaleTimeString("en-US", opts)}`;
  };

  return (
    <div className="bg-white rounded-md p-4">
      <Calendar onChange={onChange} value={value} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold my-4">Events</h1>
        <Image src="/moreDark.png" alt="more" width={20} height={20} />
      </div>

      <div className="flex flex-col gap-4">
        {events.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No upcoming events</p>
        )}
        {events.map((event) => (
          <div
            className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple"
            key={event.id}
          >
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-gray-600">{event.title}</h1>
              <span className="text-gray-300 text-xs">
                {formatTime(event.startTime, event.endTime)}
              </span>
            </div>
            <p className="mt-2 text-gray-400 text-sm line-clamp-2">{event.description}</p>
            {event.class?.name && (
              <p className="mt-1 text-xs text-indigo-500">Class: {event.class.name}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventCalendar;