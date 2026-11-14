import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Calendar } from "lucide-react";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  audience: string;
  createdAt: string;
}

interface Props {
  announcements: AnnouncementItem[];
  title?: string;
  emptyMessage?: string;
}

export function AnnouncementsFeed({
  announcements,
  title = "Academy Announcements & Notices",
  emptyMessage = "No active notices or announcements at this time.",
}: Props) {
  if (announcements.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm border-blue-100 bg-linear-to-r from-blue-50/50 via-white to-slate-50/50 overflow-hidden">
      <CardHeader className="py-3 px-5 border-b bg-blue-900 text-white flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Megaphone className="h-4 w-4 text-blue-300" />
          <CardTitle className="text-sm font-semibold tracking-wide text-white">
            {title}
          </CardTitle>
        </div>
        <Badge variant="outline" className="border-blue-400 text-blue-100 text-[10px]">
          {announcements.length} {announcements.length === 1 ? "Notice" : "Notices"}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 divide-y divide-slate-100">
        {announcements.map((item) => (
          <div key={item.id} className="py-3 first:pt-1 last:pb-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2 shrink-0" />
                {item.title}
              </h4>
              <span className="text-[11px] text-slate-400 font-mono flex items-center shrink-0">
                <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                {item.createdAt.split("T")[0]}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-3.5">
              {item.content}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
