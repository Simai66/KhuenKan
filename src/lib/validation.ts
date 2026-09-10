export function uuid(value: FormDataEntryValue | null) {
  const text = String(value || "");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      text,
    )
  )
    throw new Error("รหัสรายการไม่ถูกต้อง");
  return text;
}
export function textField(value: FormDataEntryValue | null, max = 150) {
  const text = String(value || "").trim();
  if (!text || text.length > max)
    throw new Error("กรอกข้อมูลให้ครบตามความยาวที่กำหนด");
  return text;
}
export function formError(error: unknown) {
  return {
    error:
      error instanceof Error
        ? error.message
        : "ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง",
  };
}
// Surface deliberately authored business errors, never raw SQL/schema details.
export function databaseError(error: { code?: string; message: string }) {
  if (error.code === "P0001") throw new Error(error.message);
  throw new Error("บันทึกไม่สำเร็จ กรุณาตรวจข้อมูลและลองอีกครั้ง");
}
