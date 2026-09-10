import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dateTime } from "@/lib/money";
import { ActionForm } from "@/components/action-form";
import { markRead } from "@/features/notifications/actions";
import { EmptyState } from "@/components/empty-state";
import { AutoRefresh } from "@/components/auto-refresh";
const labels: Record<string, string> = {
  debt_created: "มีบิลใหม่ที่คุณร่วมจ่าย",
  payment_due: "ถึงกำหนดคืนเงินแล้ว",
  payment_submitted: "เพื่อนส่งหลักฐานการชำระเงิน",
  payment_confirmed: "ผู้รับยืนยันการคืนเงินแล้ว",
};
export default async function Notifications() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  const splitIds = data
    .map((n) => n.expense_split_id)
    .filter((v): v is string => Boolean(v));
  const { data: splits, error: se } = splitIds.length
    ? await supabase
        .from("expense_splits")
        .select("id,expense_id")
        .in("id", splitIds)
    : { data: [], error: null };
  if (se) throw se;
  return (
    <>
      <AutoRefresh />
      <header>
        <h1 className="page-title">แจ้งเตือน</h1>
        <p className="mt-2 text-slate-500">
          100 รายการล่าสุด · อัปเดตทุก 30 วินาทีขณะเปิดหน้านี้
        </p>
      </header>
      <section className="space-y-3">
        {!data.length ? (
          <EmptyState>ยังไม่มีการแจ้งเตือน</EmptyState>
        ) : (
          data.map((n) => {
            const payload =
              n.payload &&
              typeof n.payload === "object" &&
              !Array.isArray(n.payload)
                ? n.payload
                : {};
            const expense = splits?.find(
              (s) => s.id === n.expense_split_id,
            )?.expense_id;
            const href = n.payment_id
              ? "/payments/" + n.payment_id
              : expense
                ? "/expenses/" + expense
                : "/dashboard";
            return (
              <article
                key={n.id}
                className={`panel flex flex-wrap items-center justify-between gap-4 ${!n.read_at ? "border-l-4 border-l-brand" : ""}`}
              >
                <Link href={href}>
                  <h2 className="font-semibold">
                    {labels[n.type] || "แจ้งเตือนรายการ"}
                  </h2>
                  {typeof payload.title === "string" && (
                    <p className="text-slate-600">{payload.title}</p>
                  )}
                  <p className="mt-1 text-sm text-slate-500">
                    {dateTime(n.created_at)}
                  </p>
                </Link>
                {!n.read_at && (
                  <ActionForm action={markRead} label="อ่านแล้ว">
                    <input type="hidden" name="id" value={n.id} />
                  </ActionForm>
                )}
              </article>
            );
          })
        )}
      </section>
    </>
  );
}
