import { test } from "node:test";
import assert from "node:assert/strict";
import {
  promptPayPayload,
  validatePromptPay,
} from "../src/lib/payments/promptpay";
import { encryptAccount, decryptAccount } from "../src/lib/payments/crypto";
import { randomBytes } from "node:crypto";
// Synthetic format fixture only, never a real payment destination in the UI.
const phone = "0812345678";
test("PromptPay payload includes Thai currency, exact amount and checksum", () => {
  const payload = promptPayPayload("phone", phone, 12345);
  assert.match(payload, /5303764/);
  assert.match(payload, /5406123\.45/);
  assert.match(payload, /0066812345678/);
  // Independent CRC-16/CCITT-FALSE verifies the generator output.
  let crc = 0xffff;
  for (const char of payload.slice(0, -4)) {
    crc ^= char.charCodeAt(0) << 8;
    for (let i = 0; i < 8; i++)
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  assert.equal(
    payload.slice(-4),
    crc.toString(16).toUpperCase().padStart(4, "0"),
  );
  assert.throws(() => promptPayPayload("phone", phone, 0));
  assert.throws(() => validatePromptPay("phone", "0812"));
  assert.throws(() => validatePromptPay("national_id", "1234567890123"));
});
test("Encrypted PromptPay account is randomized, authenticated and bound to its owner", () => {
  process.env.PAYMENT_ACCOUNT_ENCRYPTION_KEY = randomBytes(32).toString("hex");
  const a = encryptAccount(phone, "user-a");
  const b = encryptAccount(phone, "user-a");
  assert.notEqual(a, b);
  assert.equal(decryptAccount(a, "user-a"), phone);
  assert.throws(() => decryptAccount(a, "user-b"));
  const parts = a.split(".");
  const bytes = Buffer.from(parts[3], "base64url");
  bytes[0] ^= 1;
  parts[3] = bytes.toString("base64url");
  assert.throws(() => decryptAccount(parts.join("."), "user-a"));
  delete process.env.PAYMENT_ACCOUNT_ENCRYPTION_KEY;
});
