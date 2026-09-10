import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "คืนกัน", template: "%s | คืนกัน" },
  description: "บันทึกบิล แบ่งค่าใช้จ่าย และติดตามการคืนเงิน",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
