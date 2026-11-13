import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
              Phase 0 Complete
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            AcademyHub
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Academy Management System for Pakistan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-lg font-medium text-slate-700">
            AcademyHub — coming soon
          </p>
          <p className="text-xs text-slate-400">
            Automating admissions, fee collections, attendance, and parent updates.
          </p>
          <div className="pt-2">
            <Button variant="default" className="w-full" asChild>
              <a href="/api/health">Check API Health</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
