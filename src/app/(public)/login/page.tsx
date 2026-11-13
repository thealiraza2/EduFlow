import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
      <Suspense fallback={<div className="text-slate-500">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
