import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
function key() {
  const raw = process.env.PAYMENT_ACCOUNT_ENCRYPTION_KEY;
  if (!raw || !/^[0-9a-f]{64}$/i.test(raw))
    throw new Error(
      "ยังไม่ได้ตั้งค่า PAYMENT_ACCOUNT_ENCRYPTION_KEY เป็น hex 64 ตัว",
    );
  return Buffer.from(raw, "hex");
}
export function encryptAccount(value: string, userId: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(userId));
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}
export function decryptAccount(value: string, userId: string) {
  const [version, iv, tag, content] = value.split(".");
  if (version !== "v1" || !iv || !tag || !content)
    throw new Error("อ่านข้อมูลพร้อมเพย์ไม่ได้ กรุณาให้ผู้รับบันทึกบัญชีใหม่");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAAD(Buffer.from(userId));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(content, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
