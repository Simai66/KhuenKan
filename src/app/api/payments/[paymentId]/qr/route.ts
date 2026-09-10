import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { decryptAccount } from "@/lib/payments/crypto";
import { promptPayPayload } from "@/lib/payments/promptpay";
import { money } from "@/lib/money";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401, headers },
      );
    const { paymentId } = await params;
    const { data: payment, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();
    if (error || !payment || payment.payer_id !== user.id)
      return NextResponse.json(
        { error: "ไม่พบรายการ" },
        { status: 404, headers },
      );
    if (
      payment.status !== "pending" ||
      !payment.expires_at ||
      Date.parse(payment.expires_at) <= Date.now()
    )
      return NextResponse.json(
        { error: "รายการนี้ไม่อยู่ในสถานะชำระ หรือหมดอายุแล้ว" },
        { status: 409, headers },
      );
    const { data: accounts, error: ae } = await supabase.rpc("get_account", {
      p_payment: paymentId,
    });
    if (ae) throw new Error("account");
    const account = accounts?.[0];
    if (!account)
      return NextResponse.json(
        {
          error:
            "ผู้รับยังไม่ได้ตั้งค่าพร้อมเพย์ กรุณาให้เพื่อนบันทึกบัญชีในหน้าตั้งค่า",
        },
        { status: 409, headers },
      );
    const target = decryptAccount(
      account.promptpay_value_encrypted,
      payment.payee_id,
    );
    const payload = promptPayPayload(
      account.promptpay_type,
      target,
      payment.amount_minor,
    );
    const image = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      width: 360,
      margin: 4,
    });
    return NextResponse.json(
      {
        image,
        accountName: account.account_name,
        amount: money(payment.amount_minor),
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "สร้าง QR ไม่สำเร็จ กรุณาตรวจการตั้งค่าบัญชีและ Encryption key ของเซิร์ฟเวอร์",
      },
      { status: 500, headers },
    );
  }
}
