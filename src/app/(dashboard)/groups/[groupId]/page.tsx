import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { money, dateTime } from "@/lib/money";
import { EmptyState } from "@/components/empty-state";
import { Status } from "@/components/status";
export default async function Group({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { supabase } = await requireUser();
  const [g, e, m] = await Promise.all([
    supabase.from("groups").select("*").eq("id", groupId).maybeSingle(),
    supabase
      .from("expenses")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false }),
    supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .is("left_at", null),
  ]);
  if (g.error) throw g.error;
  if (!g.data) notFound();
  if (e.error || m.error) throw e.error || m.error;
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/groups" className="text-sm text-brand">
            กลับกลุ่มทั้งหมด
          </Link>
          <h1 className="page-title mt-2">{g.data.name}</h1>
          <p className="mt-2 text-slate-500">สมาชิก {m.data.length} คน</p>
        </div>
        <Link className="btn" href={"/groups/" + groupId + "/expenses/new"}>
          + เพิ่มบิล / บันทึกหนี้
        </Link>
      </header>
      <section className="panel">
        <h2 className="font-semibold">ชวนเพื่อนเข้ากลุ่ม</h2>
        <p className="my-2 text-sm text-slate-600">
          ส่งรหัสนี้ให้เพื่อนนำไปวางในหน้า “กลุ่มและบิล”
          ผู้ที่มีรหัสสามารถเข้าร่วมและเห็นบิลของกลุ่มได้
        </p>
        <code className="block break-all rounded-xl bg-slate-100 p-3 text-sm select-all">
          {g.data.invite_code}
        </code>
      </section>
      <section className="panel">
        <h2 className="mb-5 text-xl font-semibold">รายการบิล</h2>
        {!e.data.length ? (
          <EmptyState>ยังไม่มีบิลในกลุ่มนี้</EmptyState>
        ) : (
          <div className="divide-y divide-slate-100">
            {e.data.map((x) => (
              <Link
                href={"/expenses/" + x.id}
                key={x.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <h3 className="font-semibold">{x.title}</h3>
                  <p className="text-sm text-slate-500">
                    ครบกำหนด {dateTime(x.due_at)}
                  </p>
                </div>
                <div className="space-x-3">
                  <span className="font-semibold tabular-nums">
                    {money(x.total_amount_minor)}
                  </span>
                  <Status value={x.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
