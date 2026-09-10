"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const items = [
  ["/dashboard", "ภาพรวม"],
  ["/groups", "กลุ่มและบิล"],
  ["/payments", "การชำระเงิน"],
  ["/notifications", "แจ้งเตือน"],
  ["/settings", "ตั้งค่า"],
] as const;
export function Navigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="เมนูหลัก"
      className="flex flex-wrap gap-1 lg:flex-col lg:gap-2"
    >
      {items.map(([href, label], i) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname.startsWith(href) ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${pathname.startsWith(href) ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-100"}`}
        >
          <span className="hidden w-5 text-xs text-slate-400 lg:block">
            0{i + 1}
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
}
