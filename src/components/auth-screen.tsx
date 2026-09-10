import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { authenticate } from "@/features/auth/actions";
export function AuthScreen({
  register = false,
  confirmationError = false,
}: {
  register?: boolean;
  confirmationError?: boolean;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-ink p-16 text-white lg:flex lg:flex-col lg:justify-between">
        <span className="text-xl font-semibold">
          คืนกัน<span className="text-blue-300">.</span>
        </span>
        <div>
          <p className="mb-5 text-sm tracking-widest text-blue-200">
            แชร์บิล ดูยอด คืนเงิน
          </p>
          <h1 className="text-5xl font-semibold leading-snug">
            แชร์บิลให้ชัด
            <br />
            คืนเงินให้ครบ
          </h1>
          <p className="mt-6 max-w-md text-slate-300">
            เก็บรายการที่จ่ายแทนกัน ดูยอดค้าง และติดตามการคืนเงินในที่เดียว
          </p>
        </div>
        <p className="text-sm text-slate-400">
          ยอดชำระจะอัปเดตเมื่อผู้รับยืนยันเงินแล้ว
        </p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-7">
          <Link href="/" className="font-bold text-brand lg:hidden">
            คืนกัน
          </Link>
          <div>
            <h1 className="page-title">
              {register ? "สร้างบัญชี" : "เข้าสู่ระบบ"}
            </h1>
            <p className="mt-2 text-slate-600">
              {register
                ? "เริ่มบันทึกค่าใช้จ่ายร่วมกับเพื่อน"
                : "กลับมาดูบิลและยอดค้างของคุณ"}
            </p>
          </div>
          <>
            {confirmationError && (
              <p
                role="alert"
                className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
              >
                ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุ กรุณาเปิดลิงก์ล่าสุดในอีเมล
                หรือลองเข้าสู่ระบบหากยืนยันแล้ว
              </p>
            )}
          </>
          <ActionForm
            action={authenticate}
            label={register ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
          >
            <input
              type="hidden"
              name="mode"
              value={register ? "register" : "login"}
            />
            {register && (
              <label className="block">
                <span className="label">ชื่อที่แสดง</span>
                <input
                  name="display_name"
                  required
                  maxLength={80}
                  autoComplete="name"
                  className="field"
                />
              </label>
            )}
            <label className="block">
              <span className="label">อีเมล</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="field"
              />
            </label>
            <label className="block">
              <span className="label">รหัสผ่าน</span>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete={register ? "new-password" : "current-password"}
                className="field"
              />
              <span className="text-sm text-slate-500">
                อย่างน้อย 8 ตัวอักษร
              </span>
            </label>
          </ActionForm>
          <p className="text-sm text-slate-600">
            {register ? "มีบัญชีอยู่แล้ว?" : "ยังไม่มีบัญชี?"}{" "}
            <Link
              className="font-semibold text-brand underline"
              href={register ? "/login" : "/register"}
            >
              {register ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
