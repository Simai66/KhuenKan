import generatePayload from "promptpay-qr";
export function validatePromptPay(type: string, value: string) {
  const clean = value.replace(/[ -]/g, "");
  if (type === "phone") {
    if (!/^0[689]\d{8}$/.test(clean))
      throw new Error("ใช้เบอร์มือถือไทย 10 หลักที่ผูกพร้อมเพย์");
  } else if (type === "national_id") {
    if (!/^\d{13}$/.test(clean)) throw new Error("เลขประจำตัวต้องมี 13 หลัก");
    const digits = clean.split("").map(Number);
    const sum = digits.slice(0, 12).reduce((s, d, i) => s + d * (13 - i), 0);
    if ((11 - (sum % 11)) % 10 !== digits[12])
      throw new Error("เลขประจำตัวไม่ผ่านการตรวจรูปแบบ");
  } else throw new Error("ชนิดพร้อมเพย์ไม่ถูกต้อง");
  return clean;
}
export function promptPayPayload(type: string, target: string, minor: number) {
  if (!Number.isSafeInteger(minor) || minor <= 0 || minor > 10_000_000_000)
    throw new Error("ยอด QR ไม่ถูกต้อง");
  return generatePayload(validatePromptPay(type, target), {
    amount: minor / 100,
  });
}
