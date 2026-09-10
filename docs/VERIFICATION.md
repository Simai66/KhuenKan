# ผลตรวจสอบ

ตรวจในสภาพแวดล้อม Node.js 24.19.0 โดยใช้ dependencies ที่ pin ใน package-lock.json

| รายการ              | ผล                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------- |
| `npm run typecheck` | ผ่าน                                                                                  |
| `npm run build`     | ผ่าน Next.js production build และ TypeScript                                          |
| `npm test`          | ผ่าน 5 ชุดทดสอบ                                                                       |
| `npm run db:test`   | ผ่าน 23 สถานการณ์บน PostgreSQL engine ผ่าน PGlite                                     |
| `npm run test:http` | ผ่าน HTTP ของ login/register/setup และ redirects อีก 2 กรณี                           |
| Supabase Advisors   | รันไม่ได้ เพราะไม่มี local PostgreSQL ที่ port 54322 และไม่มี Docker ในสภาพแวดล้อมนี้ |

## ทดสอบอะไรแล้ว

- แปลงเงินบาทเป็นสตางค์โดยไม่สูญเสียทศนิยม; ปฏิเสธจำนวนเงินติดลบ, scientific notation และทศนิยมเกิน 2 ตำแหน่ง
- การหารเท่ากันรักษายอดรวมและกระจายเศษสตางค์; เปอร์เซ็นต์รวมต้อง 100
- PromptPay payload มีสกุลเงิน, ยอดที่ถูกต้อง และ CRC ตรงกับการคำนวณแยกจาก library
- AES-256-GCM ถอดรหัสคืนได้ ใช้ IV สุ่ม และปฏิเสธข้อมูลถูกแก้หรือเจ้าของบัญชีไม่ตรง
- Anonymous เรียก RPC ไม่ได้ แม้ฐานข้อมูลมี default grants แบบ permissive
- Signup trigger, สร้างกลุ่มพร้อม owner, join เฉพาะรหัสถูกต้อง และกันการเพิ่มสมาชิกโดยตรง
- การสร้างบิลที่ผลรวมผิดหรือมีคนนอกกลุ่ม rollback ทั้งรายการ
- RLS แยกข้อมูลสมาชิก/คนนอก, ห้ามแก้ ledger โดยตรง, ห้าม client เรียก reminder worker
- Reminder เคารพ opt-out, ไม่ส่งซ้ำ, พักระหว่าง submitted และหยุดเมื่อคืนครบ
- ผู้ที่ไม่ใช่ลูกหนี้สร้างคำขอชำระไม่ได้; ยอดเกินค้างถูกปฏิเสธ
- Idempotency ของการสร้างและยืนยันชำระ; active payment ซ้ำถูกปฏิเสธ
- Storage policy ปฏิเสธคนนอกและป้องกันผู้รับอ่านภาพที่ยังไม่ส่ง; submit ต้องมี object จริงใน fixtures
- ผู้จ่ายยืนยันรับเงินเองไม่ได้; ห้ามยกเลิก submitted; ยืนยันบางส่วนหักยอดครั้งเดียว
- ห้าม void บิลที่ชำระแล้ว; private account จำกัดสิทธิ์; confirmed history ยังอยู่หลังคืนครบ
- Mark-read กระทบเฉพาะ notification ของผู้ใช้

## ยังยืนยันไม่ได้

ยังไม่ได้เชื่อมกับ Supabase project จริง และไม่มี Docker จึงยังไม่ได้ทดสอบ Supabase Auth/Storage HTTP services, email confirmation, cookie refresh กับบัญชีจริง, การเปิด signed URL จริง หรือ `pg_cron` extension/job บน Supabase

PGlite ใช้ PostgreSQL engine จริงและทดสอบ SQL/RLS/transactions แต่ตาราง auth/storage เป็น test fixtures, ไม่มี bank/payment provider และไม่ใช่การทดสอบภาระพร้อมกันหลาย connection

ยังไม่ได้ทดสอบใน browser เพื่อยืนยันภาพบนทุกขนาดจอหรือในแอปธนาคารจริง UI ใช้ responsive Tailwind และมีภาษาไทย แต่ไม่อ้างว่าผ่าน visual QA หรือการสแกนธนาคารแล้ว

การยืนยันชำระเป็นการกดโดยผู้รับหลังตรวจยอดเงินจริง ไม่ได้ตรวจสลิปอัตโนมัติ ไม่ได้เชื่อม webhook ธนาคาร ไม่มี email/LINE/push notification

## ตรวจต่อบนเครื่องผู้ใช้

หลังเปิด Supabase Local และรัน migrations:

```bash
npx supabase db advisors --local
npm run dev
```

ทดลอง flow A/B ตาม README และตรวจงาน `friend-debt-reminders` ใน `cron.job`/`cron.job_run_details` ก่อนใช้กับข้อมูลจริง
