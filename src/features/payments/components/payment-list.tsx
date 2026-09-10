import Link from "next/link";
import { money, dateTime } from "@/lib/money";
import { Status } from "@/components/status";
import { EmptyState } from "@/components/empty-state";
import type { PaymentRow } from "@/types/database";
export function PaymentList({
  payments,
  me,
  names,
}: {
  payments: PaymentRow[];
  me: string;
  names: Record<string, string>;
}) {
  return !payments.length ? (
    <EmptyState>ยังไม่มีรายการชำระเงิน</EmptyState>
  ) : (
    <div className="divide-y divide-slate-100">
      {payments.map((p) => (
        <Link
          key={p.id}
          href={"/payments/" + p.id}
          className="flex flex-wrap items-center justify-between gap-3 py-4"
        >
          <div>
            <p className="font-medium">
              {p.payer_id === me ? "คืนให้ " : "รับจาก "}
              {names[p.payer_id === me ? p.payee_id : p.payer_id] || "เพื่อน"}
            </p>
            <p className="text-sm text-slate-500">{dateTime(p.created_at)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold tabular-nums">
              {money(p.amount_minor)}
            </span>
            <Status value={p.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
