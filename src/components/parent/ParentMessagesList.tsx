"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Bell, Calendar, PhoneCall } from "lucide-react";

interface MessageItem {
  id: string;
  channel: string;
  trigger: string;
  message: string;
  createdAt: string;
  status: string;
  studentName?: string;
}

interface Props {
  messages: MessageItem[];
}

export function ParentMessagesList({ messages }: Props) {
  return (
    <Card className="shadow-1 overflow-hidden border">
      <CardHeader className="py-3 px-5 border-b bg-slate-50 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">
              Official Messages & Notifications
            </CardTitle>
            <CardDescription className="text-xs">
              Archive of SMS absence alerts and fee reminder notices dispatched to your phone.
            </CardDescription>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {messages.length} Notices
        </Badge>
      </CardHeader>

      <CardContent className="p-0">
        {messages.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <Bell className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
            No notification notices logged for your student profiles.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {messages.map((msg) => (
              <div key={msg.id} className="p-4 space-y-1.5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold py-0.5 px-2 ${
                        msg.trigger === "ABSENCE"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : msg.trigger === "FEE_REMINDER"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {msg.trigger === "ABSENCE"
                        ? "Absence Notice"
                        : msg.trigger === "FEE_REMINDER"
                        ? "Fee Reminder"
                        : "Notice"}
                    </Badge>

                    {msg.studentName && (
                      <span className="font-semibold text-slate-800 text-xs">
                        {msg.studentName}
                      </span>
                    )}

                    <span className="text-xs font-mono text-slate-400">
                      via {msg.channel}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    {msg.createdAt.replace("T", " ").substring(0, 16)}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100 font-sans">
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
