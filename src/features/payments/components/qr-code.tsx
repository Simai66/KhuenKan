"use client";
import { useEffect, useState } from "react";
type QrResult = { image: string; accountName: string; amount: string };
export function QrCode({ paymentId }: { paymentId: string }) {
  const [data, setData] = useState<QrResult | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setData(null);
    fetch("/api/payments/" + paymentId + "/qr", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "สร้าง QR ไม่สำเร็จ");
        setData(body);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [paymentId, retry]);
  if (error)
    return (
      <div role="alert" className="rounded-xl bg-amber-50 p-5">
        <p>{error}</p>
        <button
          type="button"
          className="mt-3 underline"
          onClick={() => setRetry((v) => v + 1)}
        >
          ลองอีกครั้ง
        </button>
      </div>
    );
  if (!data) return <p role="status">กำลังสร้าง QR…</p>;
  return (
    <div className="text-center">
      <p className="text-sm font-semibold text-brand">PROMPTPAY</p>
      <img
        src={data.image}
        alt={"QR พร้อมเพย์จำนวน " + data.amount}
        width={300}
        height={300}
        className="mx-auto my-3 h-auto max-w-full"
      />
      <p className="text-2xl font-bold">{data.amount}</p>
      <p className="mt-2">ผู้รับ: {data.accountName}</p>
      <p className="mt-2 text-sm text-slate-500">
        ชื่อข้างต้นระบุโดยผู้รับ ตรวจชื่อและยอดในแอปธนาคารก่อนโอน
      </p>
      <a
        href={data.image}
        download={"promptpay-" + paymentId + ".png"}
        className="btn-secondary mt-4"
      >
        บันทึก QR
      </a>
    </div>
  );
}
