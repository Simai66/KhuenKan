export default function Setup() {
  return (
    <main className="mx-auto max-w-2xl p-6 py-16">
      <div className="panel space-y-5">
        <span className="text-sm font-semibold text-brand">คืนกัน</span>
        <h1 className="page-title">เชื่อมต่อ Supabase ก่อนเริ่มใช้งาน</h1>
        <p>
          ยังไม่ได้ตั้งค่าฐานข้อมูลและระบบเข้าสู่ระบบ
          โปรเจกต์นี้ไม่มีข้อมูลจำลอง
        </p>
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            คัดลอก <code>.env.example</code> เป็น <code>.env.local</code>
          </li>
          <li>ใส่ Supabase URL และ Publishable key</li>
          <li>สร้าง Encryption key ตาม README แล้วรัน database migration</li>
          <li>
            เริ่มเซิร์ฟเวอร์ใหม่ด้วย <code>npm run dev</code>
          </li>
        </ol>
        <p className="text-sm text-slate-600">
          ดูขั้นตอนสำหรับ Supabase Local และ Supabase Cloud ใน README.md
        </p>
        <a className="btn" href="/login">
          ไปหน้าเข้าสู่ระบบ
        </a>
      </div>
    </main>
  );
}
