const labels: Record<string, string> = {
  pending: "รอชำระ",
  submitted: "รอผู้รับตรวจสอบ",
  confirmed: "ยืนยันแล้ว",
  rejected: "ไม่อนุมัติ",
  expired: "หมดอายุ",
  cancelled: "ยกเลิก",
  posted: "บันทึกแล้ว",
  void: "ยกเลิกบิล",
  draft: "ฉบับร่าง",
};
export function Status({ value }: { value: string }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${value === "confirmed" ? "bg-emerald-50 text-emerald-800" : value === "submitted" ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-600"}`}
    >
      {labels[value] || value}
    </span>
  );
}
