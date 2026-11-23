import { requireSuperAdmin } from "@/lib/permissions";
import { ConsolePageHeader } from "@/components/superadmin/ConsoleUI";
import { CreateAcademyForm } from "@/components/superadmin/CreateAcademyForm";

export const metadata = { title: "New academy | EduFlow Platform" };

export default async function NewAcademyPage() {
  await requireSuperAdmin();
  return (
    <div className="min-h-screen bg-canvas">
      <ConsolePageHeader
        title="New academy"
        description="Onboard a school yourself — for walk-in clients, demos or migrations."
        back={{ href: "/superadmin", label: "All academies" }}
      />
      <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-8 sm:py-8">
        <CreateAcademyForm />
      </div>
    </div>
  );
}
