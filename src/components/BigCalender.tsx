"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";

const localizer = momentLocalizer(moment);

// Helper: Converts Day ("MONDAY") + Time ("09:00") to the CURRENTLY VIEWED WEEK's Date
const setDateToViewWeek = (
  dayStr: string,
  timeValue: string | Date,
  baseDate: Date
) => {
  const dayMap: Record<string, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
  };

  const targetDay = dayMap[dayStr] || 1;
  const currentDay = baseDate.getDay(); // Currently viewed calendar date

  // Calculate Monday of the viewed week
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + distanceToMonday);

  // Target day's date in viewed week
  const targetDate = new Date(monday);
  targetDate.setDate(monday.getDate() + (targetDay - 1));

  let hours = 9;
  let minutes = 0;

  if (timeValue instanceof Date) {
    const dt = new Date(timeValue);
    if (!isNaN(dt.getTime())) {
      hours = dt.getHours();
      minutes = dt.getMinutes();
    }
  } else if (typeof timeValue === "string") {
    if (timeValue.includes("T")) {
      const dt = new Date(timeValue);
      if (!isNaN(dt.getTime())) {
        hours = dt.getHours();
        minutes = dt.getMinutes();
      }
    } else if (timeValue.includes(":")) {
      const parts = timeValue.split(":");
      hours = parseInt(parts[0], 10) || 9;
      minutes = parseInt(parts[1], 10) || 0;
    }
  }

  targetDate.setHours(hours, minutes, 0, 0);
  return targetDate;
};

export type LessonItem = {
  id: number;
  name?: string;
  day: string;
  startTime: string | Date;
  endTime: string | Date;
  subject?: { name: string };
  class?: { name: string };
  teacher?: { name: string; surname: string };
};

type Props = {
  lessons?: LessonItem[];
};

const BigCalendar = ({ lessons = [] }: Props) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);
  // ✅ Currently active calendar date tracking
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Convert raw lessons dynamically based on currently viewed week
  const events = lessons.map((l) => {
    let title = l.name || l.subject?.name || "Lesson";
    if (l.subject?.name && l.class?.name) {
      title = `${l.subject.name} - ${l.class.name}`;
    } else if (l.subject?.name && l.teacher?.surname) {
      title = `${l.subject.name} (${l.teacher.surname})`;
    }

    return {
      id: l.id,
      title,
      start: setDateToViewWeek(l.day, l.startTime, currentDate),
      end: setDateToViewWeek(l.day, l.endTime, currentDate),
    };
  });

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      views={[Views.WORK_WEEK, Views.DAY]}
      view={view}
      onView={(newView) => setView(newView)}
      date={currentDate} // ✅ Controlled date
      onNavigate={(newDate) => setCurrentDate(newDate)} // ✅ Next/Back click par date update
      style={{ height: "100%" }}
      min={new Date(2025, 1, 1, 8, 0, 0)}  // 8:00 AM
      max={new Date(2025, 1, 1, 17, 0, 0)} // 5:00 PM
    />
  );
};

export default BigCalendar;