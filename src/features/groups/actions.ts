"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { uuid, textField, formError, databaseError } from "@/lib/validation";
import type { FormState } from "@/components/action-form";
export async function createGroup(
  _s: FormState,
  f: FormData,
): Promise<FormState> {
  const { supabase } = await requireUser();
  let id: string;
  try {
    const { data, error } = await supabase.rpc("create_group", {
      p_name: textField(f.get("name"), 100),
    });
    if (error) databaseError(error);
    id = data!;
  } catch (e) {
    return formError(e);
  }
  revalidatePath("/groups");
  redirect("/groups/" + id);
}
export async function joinGroup(
  _s: FormState,
  f: FormData,
): Promise<FormState> {
  const { supabase } = await requireUser();
  let id: string;
  try {
    const { data, error } = await supabase.rpc("join_group", {
      p_code: uuid(f.get("code")),
    });
    if (error) databaseError(error);
    id = data!;
  } catch (e) {
    return formError(e);
  }
  revalidatePath("/groups");
  redirect("/groups/" + id);
}
