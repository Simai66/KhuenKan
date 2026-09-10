import { requireUser } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { saveProfile, saveAccount } from "@/features/settings/actions";
export default async function Settings() {
  const { supabase, user } = await requireUser();
  const [p, a] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.rpc("get_account", {}),
  ]);
  if (p.error || a.error) throw p.error || a.error;
  const account = a.data?.[0];
  return (
    <>
      <header>
        <h1 className="page-title">ตั้งค่า</h1>
      </header>
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section className="panel">
          <h2 className="mb-5 text-xl font-semibold">โปรไฟล์และการแจ้งเตือน</h2>
          <ActionForm action={saveProfile}>
            <label className="block">
              <span className="label">ชื่อที่แสดง</span>
              <input
                name="name"
                className="field"
                maxLength={80}
                required
                defaultValue={p.data.display_name}
              />
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="reminders"
                defaultChecked={p.data.reminders_enabled}
                className="mt-1 h-5 w-5 accent-blue-600"
              />
              <span>รับการทวงเงินอัตโนมัติภายในแอป</span>
            </label>
            <p className="text-sm text-slate-500">
              การแจ้งรายการใหม่และการยืนยันเงินยังแสดงตามปกติ
            </p>
          </ActionForm>
        </section>
        <section className="panel">
          <h2 className="mb-2 text-xl font-semibold">พร้อมเพย์สำหรับรับเงิน</h2>
          <p className="mb-5 text-sm text-slate-600">
            {account
              ? "ตั้งค่าแล้ว: " + account.account_name
              : "ยังไม่ได้ตั้งค่าบัญชีรับเงิน"}{" "}
            · ต้องเป็นหมายเลขที่ผูกพร้อมเพย์แล้ว
          </p>
          <ActionForm action={saveAccount}>
            <label className="block">
              <span className="label">ชื่อผู้รับตามบัญชี</span>
              <input
                className="field"
                name="account_name"
                required
                maxLength={100}
                defaultValue={account?.account_name}
              />
            </label>
            <label className="block">
              <span className="label">ชนิดพร้อมเพย์</span>
              <select
                className="field"
                name="type"
                defaultValue={account?.promptpay_type || "phone"}
              >
                <option value="phone">เบอร์มือถือ</option>
                <option value="national_id">เลขประจำตัว 13 หลัก</option>
              </select>
            </label>
            <label className="block">
              <span className="label">หมายเลขพร้อมเพย์</span>
              <input
                className="field"
                name="target"
                inputMode="numeric"
                autoComplete="off"
                required
                maxLength={16}
                placeholder="กรอกหมายเลขใหม่เพื่อบันทึก"
              />
            </label>
            <p className="text-sm text-slate-500">
              ข้อมูลถูกเข้ารหัส ชื่อที่กรอกเป็นข้อมูลจากคุณ
              ยังไม่ได้ตรวจยืนยันกับธนาคาร
            </p>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
