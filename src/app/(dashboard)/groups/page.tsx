import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { createGroup, joinGroup } from "@/features/groups/actions";
import { EmptyState } from "@/components/empty-state";
export default async function Groups() {
  const { supabase } = await requireUser();
  const { data: groups, error } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (
    <>
      <header>
        <p className="mb-1 text-sm font-medium text-brand">ค่าใช้จ่ายร่วมกัน</p>
        <h1 className="page-title">กลุ่มและบิล</h1>
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="panel">
          <h2 className="mb-4 text-lg font-semibold">สร้างกลุ่มใหม่</h2>
          <ActionForm action={createGroup} label="สร้างกลุ่ม">
            <label>
              <span className="label">ชื่อกลุ่ม</span>
              <input
                className="field"
                name="name"
                required
                maxLength={100}
                placeholder="เช่น เพื่อนหอ / ทริปเชียงใหม่"
              />
            </label>
          </ActionForm>
        </section>
        <section className="panel">
          <h2 className="mb-4 text-lg font-semibold">เข้าร่วมกลุ่มของเพื่อน</h2>
          <ActionForm action={joinGroup} label="เข้าร่วม">
            <label>
              <span className="label">รหัสเชิญจากเพื่อน</span>
              <input
                className="field"
                name="code"
                required
                placeholder="วางรหัสเชิญกลุ่ม"
              />
            </label>
          </ActionForm>
        </section>
      </div>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">กลุ่มของคุณ</h2>
        {!groups?.length ? (
          <EmptyState>
            ยังไม่มีกลุ่ม สร้างกลุ่มหรือใช้รหัสที่เพื่อนส่งมา
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((g) => (
              <Link
                href={"/groups/" + g.id}
                key={g.id}
                className="panel transition hover:border-blue-400"
              >
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 font-bold text-brand">
                  {g.name.slice(0, 1)}
                </span>
                <h3 className="font-semibold">{g.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  เปิดกลุ่มและดูรายการบิล
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
