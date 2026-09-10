import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl p-10">
      <h1 className="page-title">ไม่พบรายการนี้</h1>
      <p className="my-4">รายการอาจไม่มีอยู่ หรือคุณไม่มีสิทธิ์เข้าถึง</p>
      <Link className="btn" href="/dashboard">
        กลับภาพรวม
      </Link>
    </main>
  );
}
