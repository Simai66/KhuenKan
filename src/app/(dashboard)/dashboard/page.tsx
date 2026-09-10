import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { money, dateTime } from "@/lib/money";
import { PaymentList } from "@/features/payments/components/payment-list";
import { EmptyState } from "@/components/empty-state";
import { AutoRefresh } from "@/components/auto-refresh";
export default async function Dashboard() {
  const { supabase, user } = await requireUser();
  const [totals, balances, payments, profile] = await Promise.all([
    supabase.rpc("dashboard_totals", {}),
    supabase
      .rpc("balances", {})
      .or(`user_id.eq.${user.id},paid_by.eq.${user.id}`)
      .gt("remaining_minor", 0)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(20),
    supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("users").select("display_name").eq("id", user.id).single(),
  ]);
  for (const result of [totals, balances, payments, profile])
    if (result.error) throw result.error;
  const t = totals.data![0];
  const debts = balances.data!;
  const recent = payments.data!;
  const ids = [
    ...new Set([
      ...debts.flatMap((b) => [b.user_id, b.paid_by]),
      ...recent.flatMap((p) => [p.payer_id, p.payee_id]),
    ]),
  ];
  const { data: people, error } = ids.length
    ? await supabase.from("users").select("id,display_name").in("id", ids)
    : { data: [], error: null };
  if (error) throw error;
  const names = Object.fromEntries(
    (people || []).map((p) => [p.id, p.display_name]),
  );
  return (
    <>
      <AutoRefresh />
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-brand">
            บัญชีค่าใช้จ่ายของคุณ
          </p>
          <h1 className="page-title">ภาพรวมของ {profile.data!.display_name}</h1>
        </div>
        <Link className="btn" href="/groups">
          + บันทึกหนี้ / แชร์บิล
        </Link>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-ink p-6 text-white">
          <p className="text-sm text-slate-300">ยอดที่เพื่อนต้องคืนคุณ</p>
          <p className="my-4 text-3xl font-bold tabular-nums">
            {money(t.receivable)}
          </p>
          <p className="text-sm text-blue-200">
            รับคืนยืนยันแล้วทั้งหมด {money(t.confirmed_received)}
          </p>
        </div>
        <div className="panel">
          <p className="text-sm text-slate-500">ยอดที่คุณต้องคืนเพื่อน</p>
          <p className="my-4 text-3xl font-bold tabular-nums">
            {money(t.payable)}
          </p>
          <p className="text-sm text-slate-500">เกินกำหนด {money(t.overdue)}</p>
        </div>
        <div className="panel">
          <p className="text-sm text-slate-500">
            ยอดสุทธิ (ต้องรับ − ต้องจ่าย)
          </p>
          <p className="my-4 text-3xl font-bold tabular-nums text-brand">
            {money(t.receivable - t.payable)}
          </p>
          <p className="text-sm text-slate-500">คำนวณจากยอดชำระที่ยืนยันแล้ว</p>
        </div>
      </section>
      {t.awaiting_review > 0 && (
        <Link
          href="/payments"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"
        >
          <span>มีหลักฐานรอคุณตรวจสอบ {t.awaiting_review} รายการ</span>
          <span className="text-sm font-semibold underline">
            ตรวจการชำระเงิน
          </span>
        </Link>
      )}
      <section className="panel">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-xl font-semibold">ยอดค้างที่ต้องติดตาม</h2>
          <p className="text-sm text-slate-500">
            สูงสุด 20 รายการ เรียงตามกำหนดชำระ
          </p>
        </div>
        {!debts.length ? (
          <EmptyState>
            ยังไม่มียอดค้างของคุณ เริ่มเพิ่มบิลได้จากหน้ากลุ่ม
          </EmptyState>
        ) : (
          <div className="divide-y divide-slate-100">
            {debts.map((b) => (
              <Link
                href={"/expenses/" + b.expense_id}
                key={b.split_id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-sm text-slate-600">
                    {b.user_id === user.id
                      ? "คุณต้องคืน " + (names[b.paid_by] || "เพื่อน")
                      : (names[b.user_id] || "เพื่อน") + " ต้องคืนคุณ"}
                  </p>
                  <p className="text-sm text-slate-500">
                    ครบกำหนด {dateTime(b.due_at)}
                  </p>
                </div>
                <span
                  className={`font-semibold tabular-nums ${b.user_id === user.id ? "text-slate-800" : "text-blue-700"}`}
                >
                  {money(b.remaining_minor)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="panel">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">ธุรกรรมล่าสุด</h2>
          <Link href="/payments" className="text-sm font-medium text-brand">
            ดูทั้งหมด
          </Link>
        </div>
        <PaymentList payments={recent} me={user.id} names={names} />
      </section>
    </>
  );
}
