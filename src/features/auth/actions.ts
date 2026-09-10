"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { FormState } from "@/components/action-form";
export async function authenticate(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  if (!hasSupabaseEnv())
    return { error: "กรุณาตั้งค่า Supabase ใน .env.local ก่อน" };
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const register = form.get("mode") === "register";
  const name = String(form.get("display_name") || "").trim();
  if (
    !email ||
    password.length < 8 ||
    (register && (!name || name.length > 80))
  )
    return { error: "กรอกข้อมูลให้ครบ และใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร" };
  const supabase = await createClient();
  if (register) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: new URL(
          "/auth/callback",
          process.env.APP_URL || "http://localhost:3000",
        ).toString(),
      },
    });
    if (error)
      return { error: "สมัครไม่สำเร็จ กรุณาตรวจข้อมูลหรือลองอีกครั้งภายหลัง" };
    if (!data.session)
      return { success: "ตรวจอีเมลเพื่อยืนยันบัญชี แล้วกลับมาเข้าสู่ระบบ" };
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error)
      return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือยังไม่ได้ยืนยันอีเมล" };
  }
  redirect("/dashboard");
}
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
  redirect("/login");
}
