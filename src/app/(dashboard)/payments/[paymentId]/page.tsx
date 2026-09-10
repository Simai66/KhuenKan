import { SlipInput } from "@/features/payments/components/slip-input";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { money, dateTime } from "@/lib/money";
import { Status } from "@/components/status";
import { ActionForm } from "@/components/action-form";
import {
  submitPayment,
  reviewPayment,
  cancelPayment,
} from "@/features/payments/actions";
import { QrCode } from "@/features/payments/components/qr-code";
import { AutoRefresh } from "@/components/auto-refresh";
export default async function Payment({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  const { supabase, user } = await requireUser();
  const { data: p, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  if (error) throw error;
  if (!p) notFound();
  const { data: split, error: se } = await supabase
    .from("expense_splits")
    .select("expense_id")
    .eq("id", p.expense_split_id)
    .single();
  if (se) throw se;
  let slipUrl: string | null = null;
  if (p.slip_path) {
    const { data, error: ue } = await supabase.storage
      .from("payment-slips")
      .createSignedUrl(p.slip_path, 120);
    if (ue) throw ue;
    slipUrl = data.signedUrl;
  }
  const payer = p.payer_id === user.id;
  return (
    <>
      <AutoRefresh />
      <header>
        <Link href="/payments" className="text-sm text-brand">
          กลับการชำระเงิน
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="page-title">รายละเอียดการชำระ</h1>
          <Status value={p.status} />
        </div>
        <p className="mt-2 text-slate-500">
          สร้างเมื่อ {dateTime(p.created_at)}
        </p>
      </header>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className="panel">
          <p className="text-sm text-slate-500">ยอดรายการนี้</p>
          <p className="my-3 text-4xl font-bold">{money(p.amount_minor)}</p>
          <Link
            href={"/expenses/" + split.expense_id}
            className="text-sm text-brand underline"
          >
            เปิดบิลต้นทาง
          </Link>
          {p.confirmed_at && (
            <p className="mt-4 text-sm text-emerald-800">
              ผู้รับยืนยันเมื่อ {dateTime(p.confirmed_at)}
            </p>
          )}
          {slipUrl && (
            <a
              className="btn-secondary mt-5 block text-center"
              href={slipUrl}
              target="_blank"
              rel="noreferrer"
            >
              เปิดหลักฐานการโอน
            </a>
          )}
          {p.status === "submitted" && (
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              รอผู้รับตรวจเงินเข้า ยอดค้างยังไม่ถูกหัก
            </p>
          )}
        </section>
        {payer && p.status === "pending" && (
          <section className="panel">
            <QrCode paymentId={p.id} />
          </section>
        )}
      </div>
      {payer && p.status === "pending" && (
        <section className="panel max-w-2xl">
          <h2 className="mb-4 text-xl font-semibold">โอนแล้ว ส่งหลักฐาน</h2>
          <p className="mb-4 text-sm text-slate-600">
            ส่งได้ก่อน {dateTime(p.expires_at)} · เมื่อส่งแล้วรอผู้รับตรวจสอบ
            อย่าโอนซ้ำ
          </p>
          <ActionForm action={submitPayment} label="ส่งหลักฐานการโอน">
            <input type="hidden" name="payment_id" value={p.id} />
            <label>
              <span className="label">
                สลิป JPG, PNG หรือ WebP ไม่เกิน 3 MB
              </span>
              <SlipInput />
            </label>
          </ActionForm>
          <details className="mt-6">
            <summary className="text-sm text-slate-600">
              ยังไม่ได้โอนและต้องการยกเลิก
            </summary>
            <div className="mt-3">
              <ActionForm action={cancelPayment} label="ยกเลิกคำขอชำระ">
                <input type="hidden" name="payment_id" value={p.id} />
                <p className="text-sm">
                  หากโอนแล้วให้ส่งหลักฐาน หรือติดต่อผู้รับเพื่อจัดการยอดก่อน
                </p>
              </ActionForm>
            </div>
          </details>
        </section>
      )}
      {!payer && p.status === "submitted" && (
        <section className="panel max-w-2xl">
          <h2 className="mb-4 text-xl font-semibold">ตรวจสอบเงินเข้า</h2>
          <ActionForm action={reviewPayment} label="ยืนยันรับเงินแล้ว">
            <input type="hidden" name="payment_id" value={p.id} />
            <input type="hidden" name="decision" value="confirm" />
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="checked"
                required
                className="mt-1 h-5 w-5"
              />
              <span>ตรวจในแอปธนาคารแล้วว่าได้รับเงินจริงตรงกับยอดนี้</span>
            </label>
          </ActionForm>
          <details className="mt-6">
            <summary className="text-sm text-slate-600">
              หลักฐานไม่ตรง หรือยังไม่ได้รับเงิน
            </summary>
            <div className="mt-3">
              <ActionForm action={reviewPayment} label="ไม่อนุมัติรายการนี้">
                <input type="hidden" name="payment_id" value={p.id} />
                <input type="hidden" name="decision" value="reject" />
                <p className="text-sm">
                  ยอดค้างจะไม่เปลี่ยน ผู้ชำระสามารถสร้างรายการใหม่ได้
                </p>
              </ActionForm>
            </div>
          </details>
        </section>
      )}
    </>
  );
}
