"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createAnnouncementAction } from "@/lib/actions/admin";
import { Megaphone, Send, Calendar, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  audience: "ALL" | "TEACHERS" | "PARENTS";
  createdAt: string;
}

interface Props {
  initialAnnouncements: AnnouncementItem[];
}

export function AdminAnnouncementsCard({ initialAnnouncements }: Props) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(initialAnnouncements);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<"ALL" | "TEACHERS" | "PARENTS">("ALL");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await createAnnouncementAction({
          title,
          content,
          audience,
        });

        if (res.success) {
          setAnnouncements([
            {
              id: res.announcementId,
              title,
              content,
              audience,
              createdAt: new Date().toISOString(),
            },
            ...announcements,
          ]);
          setTitle("");
          setContent("");
          setFeedback({
            type: "success",
            text: "Announcement posted and queued for notification broadcast!",
          });
        }
      } catch (err: any) {
        setFeedback({
          type: "error",
          text: err.message || "Failed to publish announcement",
        });
      }
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-4 border-b bg-slate-50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center">
            <Megaphone className="h-5 w-5 mr-2 text-indigo-600" />
            Academy Announcements & Broadcasts
          </CardTitle>
          <CardDescription className="text-xs">
            Post notices for exams, holidays, fee deadlines, or general circulars to teacher and parent portals.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* Create Form */}
        <form onSubmit={handleSubmit} className="space-y-3 bg-slate-50/75 p-4 rounded-lg border">
          <div className="text-xs font-semibold uppercase text-slate-600 tracking-wider">
            Post New Notice
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                placeholder="Notice Title (e.g. Ramadan Timings Revision, Mid-Term Exam Schedule)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-9 text-xs bg-white"
              />
            </div>
            <div>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
                className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-950"
              >
                <option value="ALL">Audience: All (Teachers & Parents)</option>
                <option value="TEACHERS">Audience: Teachers Only</option>
                <option value="PARENTS">Audience: Parents Only</option>
              </select>
            </div>
          </div>

          <div>
            <textarea
              rows={2}
              placeholder="Notice description or message details..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 resize-y"
            />
          </div>

          <div className="flex justify-between items-center pt-1">
            {feedback && (
              <span
                className={`text-xs flex items-center ${
                  feedback.type === "success" ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                )}
                {feedback.text}
              </span>
            )}
            <div className="ml-auto">
              <Button
                type="submit"
                size="sm"
                disabled={isPending || !title.trim() || !content.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-4"
              >
                {isPending ? (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                )}
                Publish Notice
              </Button>
            </div>
          </div>
        </form>

        {/* Existing Announcements List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase text-slate-500 flex justify-between">
            <span>Recent Notices</span>
            <span>{announcements.length} Total</span>
          </div>

          {announcements.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 italic">
              No announcements published yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
              {announcements.map((item) => (
                <div key={item.id} className="py-2.5 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">{item.title}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                        {item.audience}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.createdAt.split("T")[0]}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
