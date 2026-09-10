"use server";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { uuid, databaseError, formError } from "@/lib/validation";
import type { FormState } from "@/components/action-form";
export async function markRead(_s: FormState, f: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  try {
    const { error } = await supabase.rpc("mark_read", {
      p_id: uuid(f.get("id")),
    });
    if (error) databaseError(error);
  } catch (e) {
    return formError(e);
  }
  revalidatePath("/notifications");
  return { success: "ทำเครื่องหมายว่าอ่านแล้ว" };
}
