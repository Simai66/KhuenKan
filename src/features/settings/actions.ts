"use server";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { textField, formError, databaseError } from "@/lib/validation";
import { encryptAccount } from "@/lib/payments/crypto";
import { validatePromptPay } from "@/lib/payments/promptpay";
import type { FormState } from "@/components/action-form";
export async function saveProfile(
  _s: FormState,
  f: FormData,
): Promise<FormState> {
  const { supabase } = await requireUser();
  try {
    const { error } = await supabase.rpc("save_profile", {
      p_name: textField(f.get("name"), 80),
      p_reminders: f.get("reminders") === "on",
    });
    if (error) databaseError(error);
  } catch (e) {
    return formError(e);
  }
  revalidatePath("/settings");
  return { success: "บันทึกโปรไฟล์แล้ว" };
}
export async function saveAccount(
  _s: FormState,
  f: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  try {
    const type = String(f.get("type"));
    const target = validatePromptPay(type, String(f.get("target") || ""));
    const { error } = await supabase.rpc("save_account", {
      p_type: type,
      p_cipher: encryptAccount(target, user.id),
      p_name: textField(f.get("account_name"), 100),
    });
    if (error) databaseError(error);
  } catch (e) {
    return formError(e);
  }
  revalidatePath("/settings");
  return { success: "บันทึกพร้อมเพย์แล้ว" };
}
