import { requireUser } from "@/lib/auth";
import { Navigation } from "@/components/navigation";
import { signOut } from "@/features/auth/actions";
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-slate-200 bg-white p-4 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:p-6">
        <a
          href="/dashboard"
          className="mb-5 block text-xl font-bold tracking-tight lg:mb-10"
        >
          คืนกัน<span className="text-brand">.</span>
        </a>
        <Navigation />
        <form action={signOut} className="mt-5 lg:mt-12">
          <p className="mb-3 break-all text-xs text-slate-500">{user.email}</p>
          <button className="text-sm text-slate-600 underline">
            ออกจากระบบ
          </button>
        </form>
      </aside>
      <main id="main-content" className="min-w-0 p-4 sm:p-7 lg:p-10">
        <div className="mx-auto max-w-6xl space-y-7">{children}</div>
      </main>
    </div>
  );
}
