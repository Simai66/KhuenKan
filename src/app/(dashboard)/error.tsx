"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="panel space-y-4">
      <h1 className="text-xl font-semibold">โหลดข้อมูลไม่สำเร็จ</h1>
      <p>ตรวจการเชื่อมต่อและการตั้งค่าฐานข้อมูล แล้วลองอีกครั้ง</p>
      <button className="btn" onClick={reset}>
        ลองใหม่
      </button>
    </div>
  );
}
