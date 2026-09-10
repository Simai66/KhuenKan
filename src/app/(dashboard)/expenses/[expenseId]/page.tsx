import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { money, dateTime } from "@/lib/money";
import { Status } from "@/components/status";
import { ActionForm } from "@/components/action-form";
import { beginPayment } from "@/features/payments/actions";
import { voidExpense } from "@/features/expenses/actions";
export default async function Expense({
  params,
}: {
  params: Promise<{ expenseId: string }>;
}) {
  const { expenseId } = await params;
  const { supabase, user } = await requireUser();
  const [e, b] = await Promise.all([
    supabase.from("expenses").select("*").eq("id", expenseId).maybeSingle(),
    supabase.rpc("balances", {}).eq("expense_id", expenseId),
  ]);
  if (e.error || b.error) throw e.error || b.error;
  if (!e.data) notFound();
  const expense = e.data;
  const ids = [...new Set([expense.paid_by, ...b.data.map((s) => s.user_id)])];
  const { data: profiles, error } = await supabase
    .from("users")
    .select("id,display_name")
    .in("id", ids);
  if (error) throw error;
  const name = (id: string) =>
    profiles.find((p) => p.id === id)?.display_name || "สมาชิก";
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={"/groups/" + expense.group_id}
            className="text-sm text-brand"
          >
            กลับกลุ่ม
          </Link>
          <h1 className="page-title mt-2">{expense.title}</h1>
          <p className="mt-2 text-slate-600">
            สำรองจ่ายโดย {name(expense.paid_by)} · ครบกำหนด{" "}
            {dateTime(expense.due_at)}
          </p>
        </div>
        <Status value={expense.status} />
      </header>
      <section className="panel">
        <p className="text-sm text-slate-500">ยอดบิลทั้งหมด</p>
        <p className="my-2 text-4xl font-bold tabular-nums">
          {money(expense.total_amount_minor)}
        </p>
        <p className="text-sm text-slate-600">
          {expense.reminder_enabled
            ? "ทวงอัตโนมัติทุก " +
              expense.reminder_interval_days +
              " วันหลังครบกำหนด"
            : "ปิดการทวงอัตโนมัติ"}
        </p>
      </section>
      <section className="panel">
        <h2 className="mb-4 text-xl font-semibold">ส่วนแบ่งของแต่ละคน</h2>
        <div className="divide-y divide-slate-100">
          {b.data.map((s) => (
            <div key={s.split_id} className="py-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {name(s.user_id)}
                    {s.user_id === user.id ? " (คุณ)" : ""}
                  </h3>
                  <p className="text-sm text-slate-500">
                    ส่วนแบ่ง {money(s.amount_minor)}
                    {s.user_id === s.paid_by
                      ? " · ส่วนของผู้สำรองจ่าย"
                      : " · คืนแล้ว " + money(s.paid_minor)}
                  </p>
                </div>
                <p className="font-semibold">
                  {s.remaining_minor > 0
                    ? "ค้าง " + money(s.remaining_minor)
                    : expense.status === "void"
                      ? "ยกเลิกแล้ว"
                      : s.user_id === s.paid_by
                        ? "ไม่ต้องคืนตัวเอง"
                        : "ครบแล้ว"}
                </p>
              </div>
              {s.user_id === user.id && s.remaining_minor > 0 && (
                <div className="mt-4 max-w-md">
                  <ActionForm action={beginPayment} label="ชำระด้วย PromptPay">
                    <input type="hidden" name="split_id" value={s.split_id} />
                    <input
                      type="hidden"
                      name="key"
                      value={crypto.randomUUID()}
                    />
                    <label>
                      <span className="label">ยอดที่จะคืนครั้งนี้ (บาท)</span>
                      <input
                        className="field"
                        name="amount"
                        inputMode="decimal"
                        required
                        defaultValue={(s.remaining_minor / 100).toFixed(2)}
                      />
                    </label>
                  </ActionForm>
                  <Link
                    href="/payments"
                    className="mt-2 inline-block text-sm text-brand underline"
                  >
                    มีรายการค้างอยู่? ดูการชำระเงิน
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      {expense.created_by === user.id && expense.status === "posted" && (
        <details className="panel">
          <summary className="text-sm font-semibold text-slate-600">
            ยกเลิกบิล
          </summary>
          <div className="mt-4">
            <p className="mb-4 text-sm">
              ยกเลิกได้เมื่อไม่มีคำขอชำระที่เปิดอยู่หรือยอดที่ยืนยันแล้ว
              รายการจะยังอยู่ในประวัติ
            </p>
            <ActionForm action={voidExpense} label="ยืนยันยกเลิกบิล">
              <input type="hidden" name="expense_id" value={expense.id} />
            </ActionForm>
          </div>
        </details>
      )}
    </>
  );
}
