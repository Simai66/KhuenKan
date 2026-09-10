export const MAX_MINOR = 10_000_000_000;
export function parseMoney(value: string): number {
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(value.trim()))
    throw new Error("กรอกจำนวนเงินเป็นตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง");
  const [whole, fraction = ""] = value.trim().split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(minor) || minor > MAX_MINOR)
    throw new Error("จำนวนเงินเกินขอบเขตที่รองรับ");
  return minor;
}
export function money(minor: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(minor / 100);
}
export function equalShares(total: number, count: number) {
  if (
    !Number.isSafeInteger(total) ||
    total < 0 ||
    count < 1 ||
    !Number.isInteger(count)
  )
    throw new Error("จำนวนคนหรือยอดเงินไม่ถูกต้อง");
  const base = Math.floor(total / count);
  return Array.from(
    { length: count },
    (_, i) => base + (i < total % count ? 1 : 0),
  );
}
export function percentageShares(total: number, percentages: string[]) {
  const units = percentages.map(parseMoney);
  if (
    units.some((x) => x > 10000) ||
    units.reduce((a, b) => a + b, 0) !== 10000
  )
    throw new Error("เปอร์เซ็นต์รวมต้องเท่ากับ 100");
  // Largest remainder allocation preserves every satang deterministically.
  const raw = units.map((x) => total * x);
  const shares = raw.map((x) => Math.floor(x / 10000));
  let remaining = total - shares.reduce((a, b) => a + b, 0);
  const order = raw
    .map((x, i) => ({ i, remainder: x % 10000 }))
    .sort((a, b) => b.remainder - a.remainder || a.i - b.i);
  for (const entry of order) {
    if (remaining-- <= 0) break;
    shares[entry.i]++;
  }
  return shares;
}
export function dateTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Bangkok",
      }).format(new Date(value))
    : "ไม่กำหนด";
}
