"use client";

import { useState } from "react";
import { deleteTimetableSlotAction } from "@/lib/actions/timetable";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, User, MapPin } from "@/components/icons";

interface SlotItem {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  room: string | null;
  teacher: {
    id: string;
    user: {
      name: string;
    };
  };
}

export function TimetableGrid({
  slots,
  batchId,
}: {
  slots: SlotItem[];
  batchId: string;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(slotId: string) {
    if (!confirm("Are you sure you want to remove this timetable slot?")) return;
    setDeletingId(slotId);
    await deleteTimetableSlotAction(slotId);
    setDeletingId(null);
  }

  // Display Monday through Saturday (days 1 to 6)
  const displayDays = DAYS_OF_WEEK.filter((d) => d.id >= 1 && d.id <= 6);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {displayDays.map((day) => {
        const daySlots = slots
          .filter((s) => s.dayOfWeek === day.id)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        return (
          <div
            key={day.id}
            className="flex flex-col rounded-lg border bg-white shadow-1 overflow-hidden min-h-[300px]"
          >
            <div className="bg-slate-900 text-white font-semibold text-center py-2 px-3 text-sm">
              {day.name}
            </div>

            <div className="p-3 flex-1 space-y-2.5 bg-slate-50/50">
              {daySlots.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic py-8">
                  No classes scheduled
                </div>
              ) : (
                daySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3 rounded-md bg-white border border-slate-200 shadow-1 relative group hover:border-slate-400 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <Badge variant="secondary" className="font-semibold text-xs">
                        {slot.subject}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === slot.id}
                        onClick={() => handleDelete(slot.id)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center text-slate-800 font-medium font-mono">
                        <Clock className="h-3 w-3 mr-1 text-slate-400" />
                        {slot.startTime} – {slot.endTime}
                      </div>

                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1 text-slate-400" />
                        <span className="truncate">{slot.teacher.user.name}</span>
                      </div>

                      {slot.room && (
                        <div className="flex items-center text-slate-500">
                          <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                          <span>{slot.room}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
