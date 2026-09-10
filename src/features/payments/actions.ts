"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { uuid, formError, databaseError } from "@/lib/validation";
import { parseMoney } from "@/lib/money";
import type { FormState } from "@/components/action-form";
export async function beginPayment(
  _s: FormState,
  f: FormData,
): Promise<FormState> {
  const { supabase } = await requireUser();
  let id: string;
  try {
    const { data, error } = await supabase.rpc("begin_payment", {
      p_split: uuid(f.get("split_id")),
      p_amount: parseMoney(String(f.get("amount") || "")),
      p_key: uuid(f.get("key")),
    });
    if (error) databaseError(error);
    id = data!;
  } catch (e) {
    return formError(e);
  }
  revalidatePath("/payments");
  redirect("/payments/" + id);
}
export async function submitPayment(
  _s: FormState,
  f: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  try {
    const id = uuid(f.get("payment_id"));
    const file = f.get("slip");
    if (!(file instanceof File) || !file.size || file.size > 3 * 1024 * 1024)
      throw new Error("เลือกไฟล์รูปหลักฐานขนาดไม่เกิน 3 MB");
    const bytes = Buffer.from(await file.arrayBuffer());
    // Check signatures instead of trusting the browser's Content-Type or extension.
    const format =
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
        ? "jpg"
        : bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? "png"
          : bytes.subarray(0, 4).toString() === "RIFF" &&
              bytes.subarray(8, 12).toString() === "WEBP"
            ? "webp"
            : null;
    if (!format) throw new Error("รองรับเฉพาะภาพ JPG, PNG และ WebP");
    const { data: payment, error: pe } = await supabase
      .from("payments")
      .select("*")
      .eq("id", id)
      .single();
    if (
      pe ||
      !payment ||
      payment.payer_id !== user.id ||
      payment.status !== "pending"
    )
      throw new Error("รายการนี้ส่งหลักฐานไม่ได้");
    const path = id + "/" + crypto.randomUUID() + "." + format;
    const contentType = format === "jpg" ? "image/jpeg" : "image/" + format;
    const { error: uploadError } = await supabase.storage
      .from("payment-slips")
      .upload(path, bytes, { contentType, upsert: false });
    if (uploadError)
      throw new Error(
        "อัปโหลดไม่สำเร็จ ตรวจ Storage migration หรือขนาดไฟล์แล้วลองอีกครั้ง",
      );
    const { error } = await supabase.rpc("submit_payment", {
      p_id: id,
      p_path: path,
    });
    if (error) databaseError(error);
  } catch (e) {
    return formError(e);
  }
  revalidatePath("/", "layout");
  return { success: "ส่งหลักฐานแล้ว รอผู้รับตรวจยอดเงินจริง" };
}
export async function reviewPayment(
  _s: FormState,
  f: FormData,
): Promise<FormState> {
  const { supabase } = await requireUser();
  try {
    const confirm = f.get("decision") === "confirm";
    if (confirm && f.get("checked") !== "on")
      throw new Error("กรุณายืนยันว่าตรวจเงินเข้าในบัญชีแล้ว");
    const { error } = await supabase.rpc("review_payment", {
      p_id: uuid(f.get("payment_id")),
      p_confirm: confirm,
    });
    if (error) databaseError(error);
  } catch (e) {
    return formError(e);
  }
  revalidatePath("/", "layout");
  return { success: "บันทึกผลตรวจสอบแล้ว" };
}
export async function cancelPayment(
  _s: FormState,
  f: FormData,
): Promise<FormState> {
  const { supabase } = await requireUser();
  try {
    const { error } = await supabase.rpc("cancel_payment", {
      p_id: uuid(f.get("payment_id")),
    });
    if (error) databaseError(error);
  } catch (e) {
    return formError(e);
  }
  revalidatePath("/", "layout");
  return { success: "ยกเลิกคำขอชำระแล้ว" };
}
