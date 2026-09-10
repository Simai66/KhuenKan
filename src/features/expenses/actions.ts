"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { uuid, textField, formError, databaseError } from "@/lib/validation";
import { parseMoney, equalShares, percentageShares } from "@/lib/money";
import type { FormState } from "@/components/action-form";
export async function createExpense(
  _s: FormState,
  f: FormData,
): Promise<FormState> {
  const { supabase } = await requireUser();
  let id: string;
  try {
    const group = uuid(f.get("group_id"));
    const total = parseMoney(String(f.get("total") || ""));
    if (total <= 0) throw new Error("ยอดบิลต้องมากกว่า 0");
    const users = f.getAll("members").map(uuid);
    if (
      !users.length ||
      users.length > 100 ||
      new Set(users).size !== users.length
    )
      throw new Error("เลือกผู้แบ่งบิล 1–100 คน โดยไม่ซ้ำกัน");
    const method = String(f.get("method"));
    if (!["equal", "exact", "percentage"].includes(method))
      throw new Error("วิธีแบ่งบิลไม่ถูกต้อง");
    const percentages = users.map((u) => String(f.get("share_" + u) || "0"));
    const amounts =
      method === "equal"
        ? equalShares(total, users.length)
        : method === "percentage"
          ? percentageShares(total, percentages)
          : percentages.map(parseMoney);
    if (amounts.reduce((a, b) => a + b, 0) !== total)
      throw new Error("ผลรวมส่วนแบ่งต้องเท่ากับยอดบิล");
    const date = String(f.get("due") || "");
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new Error("วันที่ไม่ถูกต้อง");
    const due = date ? new Date(date + "T23:59:59+07:00").toISOString() : null;
    const reminder = f.get("reminder") === "on";
    if (reminder && !due)
      throw new Error("เลือกกำหนดชำระเพื่อเปิดการทวงอัตโนมัติ");
    const interval = Number(f.get("interval"));
    if (!Number.isInteger(interval) || interval < 1 || interval > 30)
      throw new Error("ระยะห่างการทวงต้องเป็น 1–30 วัน");
    const { data, error } = await supabase.rpc("create_expense", {
      p_group: group,
      p_title: textField(f.get("title")),
      p_total: total,
      p_method: method,
      p_due: due,
      p_reminder: reminder,
      p_interval: interval,
      p_splits: users.map((u, i) => ({
        user_id: u,
        amount_minor: amounts[i],
        percentage: method === "percentage" ? Number(percentages[i]) : null,
      })),
    });
    if (error) databaseError(error);
    id = data!;
  } catch (e) {
    return formError(e);
  }
  revalidatePath("/", "layout");
  redirect("/expenses/" + id);
}
export async function voidExpense(
  _s: FormState,
  f: FormData,
): Promise<FormState> {
  const { supabase } = await requireUser();
  try {
    const { error } = await supabase.rpc("void_expense", {
      p_id: uuid(f.get("expense_id")),
    });
    if (error) databaseError(error);
  } catch (e) {
    return formError(e);
  }
  revalidatePath("/", "layout");
  return { success: "ยกเลิกบิลแล้ว" };
}
