"use client";

export function SlipInput() {
  return (
    <input
      className="field"
      name="slip"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      required
      onChange={(event) => {
        const input = event.currentTarget;
        const file = input.files?.[0];
        // Reject oversized files before they reach Vercel's request-body limit.
        input.setCustomValidity(
          file && file.size > 3 * 1024 * 1024
            ? "เลือกไฟล์รูปหลักฐานขนาดไม่เกิน 3 MB"
            : "",
        );
        input.reportValidity();
      }}
    />
  );
}
