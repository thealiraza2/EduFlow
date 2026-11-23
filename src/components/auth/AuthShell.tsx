import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

/**
 * Auth layout (DESIGN.md §4.2): 440px form column + photo panel (hidden < 900px).
 */
export function AuthShell({
  children,
  photoCaption = "Students, teachers and parents — one record they can all trust.",
}: {
  children: React.ReactNode;
  photoCaption?: string;
}) {
  return (
    <main className="grid min-h-screen bg-canvas min-[900px]:grid-cols-[minmax(480px,1fr)_minmax(0,1.1fr)]">
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-10 sm:py-8">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="EduFlow home" className="rounded-md focus-visible:outline-none focus-visible:shadow-focus">
            <Logo />
          </Link>
          <Link href="/" className="rounded-md px-2 py-1 text-small text-ink-3 hover:text-ink focus-visible:outline-none focus-visible:shadow-focus">
            Back to website
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10">{children}</div>

        <div className="flex flex-col gap-2 border-t border-line pt-5 text-small text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} EduFlow</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-sidebar min-[900px]:block">
        <Image
          src="/images/campus-student.jpg"
          alt="A student holding her books on a school campus in Karachi"
          fill
          priority
          sizes="55vw"
          className="object-cover object-[46%_30%]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[rgba(15,23,20,.78)] via-[rgba(15,23,20,.1)] to-transparent" />
        <p className="absolute bottom-10 left-10 right-10 max-w-[30ch] font-serif text-[28px] leading-[1.2] text-white">
          {photoCaption}
        </p>
      </div>
    </main>
  );
}

/** Shared field label + error line for auth and settings forms. */
export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[14px] font-medium text-ink">
      {children}
    </label>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-small font-medium text-status-danger">{children}</p>;
}
