<a id="top"></a>

<div align="center">

# คืนกัน · KhuenKan

### แชร์บิล ดูยอด คืนเงิน

ค่าอาหาร ทริปกับเพื่อน หรือเงินที่ออกให้ก่อน<br>
บันทึกว่าใครจ่าย ใครค้าง และคืนกันไปแล้วเท่าไร

_A Thai-first app for shared expenses, debt reminders, and PromptPay repayments._

<p>
  <img src="https://img.shields.io/badge/Next.js-App_Router-111827?style=flat-square&amp;logo=nextdotjs&amp;logoColor=white" alt="Next.js App Router">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&amp;logo=typescript&amp;logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&amp;logo=tailwindcss&amp;logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&amp;logo=supabase&amp;logoColor=16352B" alt="Supabase">
</p>

**[เปิดเว็บคืนกัน](https://friend-debt-tracker.vercel.app)** · **[เริ่มติดตั้ง](#quick-start)** · **[คู่มือโปรเจกต์](#documentation)** · **[แจ้งปัญหา](https://github.com/Simai66/KhuenKan/issues)**

</div>

---

## เรื่องเงินในกลุ่ม ดูจบในที่เดียว

คืนกันช่วยเก็บบิล ส่วนแบ่ง และประวัติคืนเงินไว้ด้วยกัน แต่ละคนเข้าดูรายการของกลุ่มที่ตนเป็นสมาชิกได้ผ่านบัญชีของตัวเอง

| แชร์บิล                                   | แจ้งเตือน                                 | คืนเงิน                                               | ดูภาพรวม                                   |
| :---------------------------------------- | :---------------------------------------- | :---------------------------------------------------- | :----------------------------------------- |
| หารเท่ากัน ระบุยอด หรือแบ่งตามเปอร์เซ็นต์ | แจ้งในแอปเมื่อถึงกำหนด และหยุดเมื่อคืนครบ | สร้าง PromptPay QR คืนบางส่วนหรือเต็มยอด พร้อมแนบสลิป | ดูยอดต้องรับ ต้องจ่าย เกินกำหนด และประวัติ |

> **สถานะโปรเจกต์:** มีโค้ดทั้ง 4 ฟีเจอร์และเว็บบน Vercel แล้ว แต่ยังไม่ได้ยืนยันการใช้งานจริงครบวงจรด้วยสองบัญชีและแอปธนาคาร อ่าน [สถานะ deployment](docs/DEPLOYMENT.md) และ [ขอบเขตการทดสอบ](docs/VERIFICATION.md) ก่อนใช้งานกับข้อมูลจริง

### ตัวอย่าง: มื้อเดียวกัน คนละส่วน

**ตัวอย่างสมมติสำหรับอธิบายการทำงาน** — A ออกค่าอาหาร 100 บาทให้ A และ B แล้วหารเท่ากัน

| เหตุการณ์                          | B ยังต้องคืน |
| :--------------------------------- | -----------: |
| สร้างบิลและแบ่งคนละ 50 บาท         |       50 บาท |
| B ส่งสลิปคืน 20 บาท รอ A ตรวจ      |       50 บาท |
| A ตรวจเงินเข้าแล้วกดยืนยัน 20 บาท  |       30 บาท |
| A ยืนยันเงินส่วนที่เหลืออีก 30 บาท |        0 บาท |

**ยอดค้างลดหลังผู้รับยืนยันเงินเข้า** การสร้าง QR หรือแนบสลิปอย่างเดียวไม่ทำให้บิลถูกนับว่าชำระแล้ว

<a id="features"></a>

## ฟีเจอร์ในเวอร์ชันนี้

1. **Authentication และ Layout** — สมัครสมาชิกด้วยอีเมล/รหัสผ่าน, callback ยืนยันอีเมล, เข้าสู่ระบบ, ออกจากระบบ, หน้าแอปที่ตรวจ session, UI ภาษาไทยและ layout ปรับตามหน้าจอ
2. **บันทึกหนี้/แชร์บิล** — สร้างกลุ่ม, เข้าร่วมผ่านรหัสเชิญ, หารเท่ากัน/ระบุยอด/เปอร์เซ็นต์, กำหนดวันคืน, ยกเลิกบิลที่ไม่มีรายการชำระ ผู้บันทึกเป็นผู้สำรองจ่าย หากเป็นเงินยืมให้เลือกเฉพาะผู้ยืมเป็นผู้รับผิดชอบส่วนแบ่ง
3. **ทวงอัตโนมัติ** — Supabase Cron เรียกฟังก์ชันทุก 15 นาที เก็บแจ้งเตือนภายในแอปเมื่อถึงกำหนดและตามช่วงที่เลือก หยุดทวงเมื่อจ่ายครบ พักเมื่อมีหลักฐานรอผู้รับตรวจ และเคารพการปิดรับทวงของผู้ใช้
4. **PromptPay** — ผู้รับตั้งค่าพร้อมเพย์, ผู้จ่ายเลือกยอดคืนบางส่วนหรือเต็มยอด, สร้าง/ดาวน์โหลด QR, อัปโหลดสลิป private Storage, ผู้รับตรวจเงินเข้าและยืนยันหรือไม่อนุมัติ
5. **Dashboard และประวัติ** — ยอดต้องรับ/ต้องจ่าย/สุทธิ/เกินกำหนด, รายการรอตรวจ, บิลค้าง และประวัติชำระแบบแบ่งหน้า ยอดรวมคำนวณใน SQL เพื่อไม่ติดขีดจำกัดจำนวนแถวของ Data API

ไม่มีข้อมูลจำลองหรือบัญชีพร้อมเพย์กลางในแอป ผู้รับแต่ละคนตั้งค่าพร้อมเพย์ของตนเอง

<a id="quick-start"></a>

## เริ่มใช้งานบนเครื่อง

ต้องมี **Node.js 22 ขึ้นไป** และ **npm** หากใช้ Supabase Local ต้องเปิด Docker Desktop ด้วย

```bash
git clone https://github.com/Simai66/KhuenKan.git
cd KhuenKan
npm ci
cp .env.example .env.local
```

การ clone ต้องใช้บัญชีที่มีสิทธิ์เข้าถึง repository นี้ จากนั้นเลือกฐานข้อมูลหนึ่งแบบด้านล่าง

<details open>
<summary><strong>แบบที่ 1 — Supabase Local พร้อม Docker</strong></summary>

```bash
npx supabase start
npx supabase db reset
npx supabase status
```

`db reset` ล้างข้อมูล **ฐานข้อมูล local ของโปรเจกต์นี้** แล้วรัน migration ใหม่ ใช้ตอนตั้งค่าโปรเจกต์ใหม่ อย่ารันซ้ำหลังมีข้อมูลที่ต้องเก็บโดยไม่สำรองข้อมูล

จากผล `supabase status` ใส่ API URL และ Publishable key ลง `.env.local` หาก local stack แสดงเฉพาะ legacy `anon key` สามารถใช้ค่านั้นในตัวแปร `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ได้สำหรับ compatibility ห้ามใช้ service-role/secret key ในตัวแปรสาธารณะ

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=ใส่ค่าจาก-local-stack
APP_URL=http://localhost:3000
PAYMENT_ACCOUNT_ENCRYPTION_KEY=ใส่-hex-64-ตัว
```

สร้าง key 32 bytes ด้วยคำสั่งนี้ แล้วนำผลลัพธ์ไปใส่ `PAYMENT_ACCOUNT_ENCRYPTION_KEY`:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) หากยังไม่ใส่ Supabase env จะพบหน้าตั้งค่า `/setup` แทนการแสดงยอดปลอม

รักษา Encryption key เดิมไว้ เพราะถ้าเปลี่ยนโดยไม่ย้ายข้อมูล บัญชีพร้อมเพย์เดิมจะถอดรหัสไม่ได้ ต้องให้เจ้าของบันทึกบัญชีใหม่

ไฟล์ `supabase/config.toml` ใช้ PostgreSQL 17, Site URL `http://localhost:3000`, callback `/auth/callback` และปิด email confirmation สำหรับ local เพื่อให้ทดลองสองบัญชีได้ทันที หากเปิด confirmation ให้ดูอีเมลใน local mail UI ตาม URL ที่ `supabase status` แสดง

</details>

<details>
<summary><strong>แบบที่ 2 — Supabase Cloud ไม่ต้องใช้ Docker</strong></summary>

ไม่ต้องมี Docker แต่ต้องมี Supabase project ใหม่ของคุณเอง

1. รัน `npm ci` และสร้าง `.env.local` จากตัวอย่าง
2. ใน Supabase SQL Editor รันไฟล์ใน `supabase/migrations/` ตามลำดับชื่อ เริ่ม `initial_debt_tracker` แล้ว `schedule_reminders` และ `limit_slip_upload_size` ใช้กับฐานข้อมูลใหม่สำหรับแอปนี้
3. หากยังไม่เปิด extension `pg_cron` ให้เปิดใน Database Extensions ด้วยบัญชีผู้ดูแลแล้วรัน migration ของ schedule
4. ใส่ project URL และ Publishable key จาก Project Connect พร้อม Encryption key ที่สร้างตามข้างต้น
5. ตั้ง Auth Site URL เป็น `http://localhost:3000` และอนุญาต Redirect URL `http://localhost:3000/auth/callback`
6. รัน `npm run dev` สมัครสมาชิก และยืนยันอีเมลหากเปิด confirmation

อย่าส่งค่าความลับให้คนอื่น ใช้ `.env.local` บนเครื่องของคุณ และอย่า commit ไฟล์นี้

</details>

### Environment variables

ค่าหลักที่แอปต้องใช้ใน `.env.local` มี 4 ตัว ดูช่องกรอกได้ใน [`.env.example`](.env.example)

| ตัวแปร                                 | ใช้ทำอะไร                                            |   เปิดเผยใน browser    |
| :------------------------------------- | :--------------------------------------------------- | :--------------------: |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL ของ Supabase project                             |          ได้           |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key สำหรับ client โดยใช้ RLS จำกัดข้อมูล |          ได้           |
| `APP_URL`                              | URL แอป เช่น `http://localhost:3000`                 | ไม่ได้ใส่ใน client env |
| `PAYMENT_ACCOUNT_ENCRYPTION_KEY`       | Hex 64 ตัวสำหรับเข้ารหัสบัญชีพร้อมเพย์               |        **ห้าม**        |

ตัวแปรอื่นในไฟล์ตัวอย่างเป็นตัวเลือกสำหรับ admin tooling / CLI และไม่จำเป็นสำหรับคำขอปกติของแอป ห้ามนำ secret key หรือ service-role key ไปใส่ตัวแปร `NEXT_PUBLIC_*`

<a id="payment-flow"></a>

## ลองแชร์บิลและคืนเงิน

ใช้ browser ปกติเป็นบัญชี A และหน้าต่าง private/incognito เป็นบัญชี B เพื่อไม่ให้ session ทับกัน

1. A สมัครสมาชิก ตั้งค่าพร้อมเพย์ของตนเอง แล้วสร้างกลุ่ม
2. A ส่งรหัสกลุ่มให้ B นำไปวางในหน้า “กลุ่มและบิล”
3. A สร้างบิลตัวอย่าง 100 บาท เลือก A และ B แบบหารเท่ากัน ระบบควรแสดง B ค้าง 50 บาท ส่วนของ A ไม่เป็นหนี้
4. B เปิดบิล กรอกยอดคืน 20 บาท แล้วเปิด QR ตรวจชื่อและยอดในแอปธนาคารก่อนทำรายการจริง
5. หากทดลอง UI เท่านั้น อย่าโอนเงินจริง สามารถแนบภาพทดสอบและตรวจ flow ด้วยข้อมูลทดสอบที่ตกลงกันไว้ บัญชี A ต้องไม่ยืนยันว่าเป็นเงินจริงเมื่อใช้ข้อมูลจริง
6. B ส่งสลิป สถานะเปลี่ยนเป็นรอผู้รับตรวจ แต่ยอดค้างยังเป็น 50 บาท
7. A ตรวจรายการแล้วกดยืนยัน ยอดค้างจึงเป็น 30 บาท ยืนยันรายการเดิมซ้ำต้องไม่หักซ้ำ
8. คืนส่วนที่เหลือ แล้วตรวจว่ายอดค้างเป็นศูนย์และประวัติยังอยู่
9. ทดลองทวง: สร้างบิลอีกใบกำหนดชำระเป็นวันที่ผ่านมา เปิด reminder และอย่าแนบหลักฐาน รอ Cron รอบถัดไปหรือให้ผู้ดูแลเรียก `select private.send_reminders();` ใน SQL Editor

<details>
<summary><strong>อ่านขอบเขต PromptPay และการยืนยันชำระ</strong></summary>

เวอร์ชันนี้ใช้ **การโอนตรงพร้อมเพย์และผู้รับยืนยันเอง** ไม่มี payment gateway, webhook ธนาคาร, OCR หรือบริการตรวจสลิปอัตโนมัติ การสร้าง QR หรือแนบสลิปไม่ใช่หลักฐานว่ามีเงินเข้า

QR สร้างจากหมายเลขของผู้รับและยอดในฐานข้อมูล ไม่รับยอดหรือบัญชีจาก query string ของ browser ชื่อที่แสดงเป็นชื่อที่ผู้รับกรอก ต้องตรวจชื่อจริงในแอปธนาคารอีกครั้ง โค้ดตรวจรูปแบบหมายเลข แต่ไม่ได้ตรวจว่าหมายเลขผูกพร้อมเพย์กับธนาคารแล้ว

คำขอชำระมีอายุ 24 ชั่วโมงในแอป แต่ QR พร้อมเพย์ที่บันทึกไปแล้วไม่ได้ถูกเพิกถอนที่ธนาคารเมื่อคำขอหมดอายุ หากโอนหลังคำขอหมดอายุ ให้ตกลงกับผู้รับก่อนสร้างรายการใหม่และ **อย่าโอนซ้ำ**

ไม่มีการคืนเงิน/กลับรายการยืนยันใน UI และห้ามยกเลิกบิลที่มีเงินยืนยันแล้ว การเพิ่ม refund ต้องออกแบบ ledger และสิทธิ์เพิ่มเติมก่อนใช้กับกรณีนั้น

</details>

<details>
<summary><strong>อ่านการทำงานและวิธีตรวจแจ้งเตือนอัตโนมัติ</strong></summary>

แจ้งเตือนภายในแอปเท่านั้น ไม่ส่งอีเมล LINE หรือ push เบื้องหลังของโทรศัพท์ การเปิดหน้าแจ้งเตือน/ภาพรวม/รายละเอียดชำระจะ refresh ทุก 30 วินาทีเมื่อแท็บมองเห็น ส่วนการสร้าง reminder ทำในฐานข้อมูลและไม่ต้องเปิดเว็บ

บน Supabase Local ต้องเปิด Docker/ฐานข้อมูลไว้ Cron จึงทำงาน เมื่อย้าย Cloud Cron ทำงานที่ฐานข้อมูล Cloud โดยไม่ต้องเปิด localhost

ตรวจงาน Cron ด้วยบัญชีผู้ดูแล:

```sql
select jobid, jobname, schedule, active
from cron.job where jobname = 'friend-debt-reminders';

select status, return_message, start_time
from cron.job_run_details
order by start_time desc limit 10;
```

แต่ละรอบตรวจสูงสุด 500 splits เพื่อจำกัด transaction งานค้างจะถูกหยิบในรอบถัดไป ช่อง `next_reminder_at`, row lock และ `dedupe_key` ป้องกันงานทับซ้อน/แจ้งซ้ำ

</details>

<a id="development"></a>

## สำหรับผู้พัฒนา

| ส่วนของระบบ                 | เทคโนโลยี                             |
| :-------------------------- | :------------------------------------ |
| หน้าเว็บและ Server Actions  | Next.js App Router, React, TypeScript |
| หน้าตาและ responsive layout | Tailwind CSS                          |
| บัญชีผู้ใช้และ session      | Supabase Auth, `@supabase/ssr`        |
| ธุรกรรมและสิทธิ์เข้าถึง     | Postgres, RLS, transactional RPCs     |
| เก็บสลิป                    | Supabase Storage แบบ private          |
| แจ้งเตือนตามเวลา            | Supabase Cron (`pg_cron`)             |
| สร้าง QR                    | `promptpay-qr`, `qrcode`              |

เวอร์ชัน dependencies ที่ใช้จริงอยู่ใน [`package.json`](package.json) และล็อกไว้ใน [`package-lock.json`](package-lock.json)

<details>
<summary><strong>โครงสร้างไฟล์และ TypeScript contract</strong></summary>

```text
src/
  app/
    (auth)/login, register
    (dashboard)/dashboard, groups, expenses, payments, notifications, settings
    auth/callback/route.ts
    api/payments/[paymentId]/qr/route.ts
    setup/page.tsx
  components/                 Shared forms, navigation, empty/loading/status UI
  features/
    auth/actions.ts
    groups/actions.ts
    expenses/actions.ts, components/expense-form.tsx
    notifications/actions.ts
    payments/actions.ts, components/
    settings/actions.ts
  lib/
    supabase/client.ts, server.ts
    payments/crypto.ts, promptpay.ts
    auth.ts, env.ts, money.ts, validation.ts
  types/database.ts           Typed contract matching the SQL migrations
  proxy.ts
supabase/
  config.toml
  migrations/                 Tables, grants, RLS, transactional RPCs and Cron
  seed.sql                    Empty: no fake data
tests/                       Money, QR, encryption, SQL/RLS, HTTP smoke tests
docs/FEATURES.md              Files grouped by feature
docs/VERIFICATION.md          Evidence and untested boundaries
```

เอกสาร schema เดิมเสนอ Edge Function แต่ implementation นี้ใช้ SQL Cron โดยตรง เพราะส่งเฉพาะ in-app notification จึงไม่ต้องมี HTTP endpoint, Cron secret หรือ Edge Function เพิ่ม

`src/types/database.ts` เป็น TypeScript contract ที่ดูแลตาม migration ด้วยมือ ไม่ได้อ้างว่า generate จากฐานข้อมูลจริง สั่ง `npm run db:types` หลังเปิด Supabase Local เพื่อสร้าง `src/types/supabase.generated.ts` แยกไว้เปรียบเทียบ schema ก่อนปรับ contract

</details>

<details>
<summary><strong>Database, RLS และการเก็บหลักฐานชำระเงิน</strong></summary>

- ใช้เงินหน่วยสตางค์ bigint; บิลจำกัดไม่เกิน 100,000,000 บาทและ 100 ผู้แบ่งบิล
- ทุกแถวใน public tables มี RLS; anonymous ไม่ได้รับ SELECT หรือ EXECUTE RPC ของแอป
- ไม่มีสิทธิ์ INSERT/UPDATE/DELETE ตารางธุรกรรมโดยตรง แม้เป็น authenticated
- Public RPC เป็น security invoker เรียก private functions ที่มีขอบเขตชัดเจน ทุก user operation ตรวจ `auth.uid()` และสิทธิ์เจ้าของ/สมาชิก
- ฟังก์ชัน private ที่ยกระดับสิทธิ์ใช้ `search_path=''` และชื่อ schema แบบเต็ม ไม่รับ actor ID จาก client
- การสร้างบิล/ส่วนแบ่งอยู่ใน transaction เดียว การเริ่ม/ยืนยันชำระล็อกบิลและ split ตามลำดับเดียวกัน และ recheck ยอดก่อนยืนยัน
- QR/account RPC คืน encrypted account เฉพาะเจ้าของหรือผู้จ่ายที่มีคำขอ pending ของตนเอง server ถอดรหัสด้วย AES-256-GCM และผูกข้อมูลกับ user ID ผ่าน AAD
- สลิปใช้ private bucket ขนาดไม่เกิน 3 MB, ตรวจ signature ของภาพฝั่ง server, อ่านผ่าน signed URL อายุ 120 วินาที ไม่มี upsert/แก้ไขหลักฐานที่ยืนยันแล้ว
- Buckets `receipts` และ `avatars` เตรียมไว้แต่ยังไม่เปิดสิทธิ์หรือมี UI อัปโหลด ฟีเจอร์ที่ทำจริงใช้ `payment-slips`
- ถ้า upload สำเร็จแต่ transaction ส่งหลักฐานล้มเหลว อาจเหลือไฟล์ orphan; ยังไม่มี automatic storage cleanup ให้ผู้ดูแลตรวจว่าไม่ได้ถูกอ้างอิงและลบภายหลังตาม retention policy
- ไม่ใช้ Supabase secret key ในคำขอปกติ ทุกคำขอ UI ใช้ session ของผู้ใช้ ค่า `SUPABASE_SECRET_KEY` ในตัวอย่างสำรองสำหรับ tooling ที่อาจเพิ่มภายหลัง

</details>

### ตรวจสอบก่อนส่งโค้ด

```bash
npm run typecheck
npm test
npm run db:test
npm run build
npm run test:http
```

`db:test` ใช้ PostgreSQL engine ผ่าน PGlite และสร้าง fixtures แทนตาราง auth/storage เพื่อตรวจ SQL, transactions, roles และ RLS จริง แต่ไม่ได้เปิด Supabase Auth/Storage HTTP service หรือ pg_cron

`test:http` เปิด production server ชั่วคราวที่ `127.0.0.1:3107`, ตรวจหน้า login/register/setup และ redirects แล้วปิดเอง ต้องรัน build ก่อน ใช้ environment ที่ไม่มี Supabase credentials เพื่อทดสอบสภาวะก่อนตั้งค่า

ก่อนใช้กับข้อมูลจริง ให้ทดสอบ flow สองบัญชีบน Supabase ที่ตั้งค่าแล้ว รวมถึงอัปโหลด/เปิดสลิป, session refresh, การยืนยันอีเมล, Cron และ QR กับแอปธนาคารเป้าหมาย อ่านผลตรวจที่ทำแล้วใน `docs/VERIFICATION.md`

<a id="documentation"></a>

## คู่มือโปรเจกต์

| เอกสาร                                                    | เนื้อหา                                         |
| :-------------------------------------------------------- | :---------------------------------------------- |
| [ฟีเจอร์และไฟล์ที่เกี่ยวข้อง](docs/FEATURES.md)           | ไล่จาก Authentication ไปจนถึง Dashboard         |
| [ผลตรวจและสิ่งที่ยังไม่ได้ทดสอบ](docs/VERIFICATION.md)    | แยกผลทดสอบโค้ดออกจาก flow จริง                  |
| [Deployment และการตั้งค่าที่ยังเหลือ](docs/DEPLOYMENT.md) | Vercel, Supabase Auth และ environment variables |
| [Database migrations](supabase/migrations)                | Schema, RLS, RPCs และงาน Cron                   |

### Deploy บน Vercel

ใช้ build command `npm run build` และตั้งค่าหลักทั้ง 4 ตัวใน Project Settings → Environment Variables โดย `APP_URL` ต้องตรงกับ URL production ตั้ง Supabase Auth Site URL และ callback `/auth/callback` ให้ตรงกันด้วย

การเชื่อม GitHub เพื่อ deploy อัตโนมัติต้องตั้งใน Vercel Settings → Git แยกจากการอัปโค้ดขึ้น GitHub ตรวจขั้นตอนและสถานะล่าสุดที่บันทึกไว้ใน [คู่มือ deployment](docs/DEPLOYMENT.md)

จำกัดสลิป 3 MB ทั้งก่อนส่งจาก browser, ฝั่ง server และ Storage bucket ผ่าน migration `limit_slip_upload_size` และตั้ง Server Actions body limit 4 MB ถ้าเคยรัน migration เดิมแล้ว ให้รันเฉพาะ migration ใหม่ที่ยังไม่เคยรัน

## แจ้งปัญหาและเสนอการปรับปรุง

เปิด [Issue](https://github.com/Simai66/KhuenKan/issues) พร้อมขั้นตอนที่ทำ ผลที่คาดหวัง และผลที่เกิดขึ้น หากแนบภาพให้ปิดข้อมูลบัญชี หมายเลขพร้อมเพย์ สลิป และข้อมูลส่วนตัวก่อน

หากแก้โค้ด ให้ส่ง Pull Request อธิบายสิ่งที่เปลี่ยนและวิธีตรวจสอบ สำหรับฟีเจอร์ชำระเงินควรตรวจ flow ผู้จ่ายและผู้รับแยกกัน

<details>
<summary><strong>เอกสารอ้างอิงทางเทคนิค</strong></summary>

- [Supabase SSR สำหรับ Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Supabase Changelog](https://supabase.com/changelog)
- [Next.js Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [promptpay-qr source](https://github.com/dtinth/promptpay-qr)

</details>

---

<div align="center">

**คืนกัน · แชร์บิล ดูยอด คืนเงิน**

[เปิดเว็บ](https://friend-debt-tracker.vercel.app) · [กลับด้านบน](#top)

</div>
