# ไฟล์ที่สร้างตามลำดับฟีเจอร์

## 1. Authentication + Layout

- `src/app/(auth)/login/page.tsx`, `register/page.tsx`: หน้าสมัครและเข้าสู่ระบบ
- `src/features/auth/actions.ts`: sign up, sign in, sign out
- `src/app/auth/callback/route.ts`: แลก auth code เป็น session
- `src/lib/supabase/client.ts`, `server.ts`, `src/proxy.ts`: SSR cookies และ refresh session
- `src/lib/auth.ts`, `env.ts`: ตรวจตัวตนและการตั้งค่า
- `src/components/auth-screen.tsx`, `navigation.tsx`, `action-form.tsx`: UI ที่ใช้ร่วมกัน
- `src/app/layout.tsx`, `globals.css`, `(dashboard)/layout.tsx`: Layout และ Tailwind ภาษาไทย
- `src/app/setup/page.tsx`, `not-found.tsx`, `(dashboard)/loading.tsx`, `error.tsx`: สถานะที่ไม่มี config/ข้อมูล/โหลดผิดพลาด

## 2. บันทึกหนี้ / แชร์บิล

- `supabase/migrations/*_initial_debt_tracker.sql`: ตาราง, RLS, grants และ transactional RPCs
- `src/features/groups/actions.ts`: สร้างและเข้าร่วมกลุ่ม
- `src/app/(dashboard)/groups/page.tsx`, `[groupId]/page.tsx`: รายการกลุ่ม, รหัสเชิญและบิล
- `src/app/(dashboard)/groups/[groupId]/expenses/new/page.tsx`: หน้าเพิ่มบิล
- `src/features/expenses/components/expense-form.tsx`: เลือกผู้แบ่งบิลและวิธีแบ่ง
- `src/features/expenses/actions.ts`: ตรวจข้อมูลและเรียก transaction
- `src/app/(dashboard)/expenses/[expenseId]/page.tsx`: ส่วนแบ่ง, ยอดค้าง, ชำระและยกเลิก
- `src/lib/money.ts`, `validation.ts`, `src/types/database.ts`: เงิน, input validation และ type contract

## 3. แจ้งเตือนอัตโนมัติ

- `supabase/migrations/*_initial_debt_tracker.sql`: `private.send_reminders()` และ notifications
- `supabase/migrations/*_schedule_reminders.sql`: Cron ทุก 15 นาที
- `src/features/notifications/actions.ts`: ทำเครื่องหมายอ่านแล้วเฉพาะรายการของตนเอง
- `src/app/(dashboard)/notifications/page.tsx`: 100 แจ้งเตือนล่าสุดและลิงก์ไปบิล/การชำระ
- `src/components/auto-refresh.tsx`: refresh เมื่อแท็บมองเห็น

## 4. ชำระผ่าน PromptPay

- `src/lib/payments/promptpay.ts`: ตรวจหมายเลขและสร้าง payload
- `src/lib/payments/crypto.ts`: AES-256-GCM ผูกกับเจ้าของบัญชี
- `src/features/settings/actions.ts`, `src/app/(dashboard)/settings/page.tsx`: โปรไฟล์, reminder preference และพร้อมเพย์
- `src/app/api/payments/[paymentId]/qr/route.ts`: สร้าง QR จากยอดและบัญชีฝั่ง server
- `src/features/payments/actions.ts`: เริ่มชำระ, upload, ส่งตรวจ, ยืนยัน/ปฏิเสธ/ยกเลิก
- `src/features/payments/components/qr-code.tsx`: ดูและดาวน์โหลด QR
- `src/app/(dashboard)/payments/[paymentId]/page.tsx`: รายละเอียดและหลักฐาน

## 5. Dashboard + ประวัติ

- `src/app/(dashboard)/dashboard/page.tsx`: ยอดรวมจาก SQL, บิลค้างและธุรกรรมล่าสุด
- `src/app/(dashboard)/payments/page.tsx`: ประวัติแบ่งหน้า
- `src/features/payments/components/payment-list.tsx`: รายการที่ใช้ทั้ง Dashboard/ประวัติ
- `src/components/status.tsx`, `empty-state.tsx`: สถานะและหน้าไม่มีข้อมูล

## การตรวจและการตั้งค่า

- `tests/money.test.ts`, `promptpay.test.ts`: เงิน, การแบ่งเศษสตางค์, QR checksum และ encryption
- `tests/database.mjs`: PostgreSQL transactions, RLS, authorization, reminder และ partial settlement
- `tests/http-smoke.mjs`: HTTP smoke โดยไม่มี Supabase credentials
- `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `.env.example`
- `supabase/config.toml`, `seed.sql`, `README.md`, `docs/VERIFICATION.md`

## ปรับก่อน deploy Vercel

- เพิ่ม `src/features/payments/components/slip-input.tsx` ตรวจไฟล์ 3 MB ก่อนส่ง
- แก้ `src/features/payments/actions.ts` และหน้ารายละเอียดชำระให้ใช้ 3 MB
- แก้ `next.config.ts` จำกัด Server Action body ที่ 4 MB
- เพิ่ม migration `limit_slip_upload_size` จำกัด Storage ที่ 3 MB
- เพิ่ม `.vercel/` ใน `.gitignore`
