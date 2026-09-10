"use client";
import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { createExpense } from "@/features/expenses/actions";
export function ExpenseForm({
  groupId,
  members,
  me,
}: {
  groupId: string;
  members: { id: string; name: string }[];
  me: string;
}) {
  const [method, setMethod] = useState("equal");
  return (
    <ActionForm action={createExpense} label="บันทึกบิล">
      <input type="hidden" name="group_id" value={groupId} />
      <label className="block">
        <span className="label">ชื่อบิล</span>
        <input
          className="field"
          name="title"
          required
          maxLength={150}
          placeholder="เช่น มื้อเย็นวันศุกร์"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">ยอดรวม (บาท)</span>
          <input
            className="field"
            name="total"
            required
            inputMode="decimal"
            placeholder="0.00"
          />
        </label>
        <label>
          <span className="label">วิธีแบ่ง</span>
          <select
            className="field"
            name="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="equal">หารเท่ากัน</option>
            <option value="exact">ระบุยอดแต่ละคน</option>
            <option value="percentage">แบ่งตามเปอร์เซ็นต์</option>
          </select>
        </label>
      </div>
      <div>
        <p className="label">คนที่รับผิดชอบค่าใช้จ่าย</p>
        <p className="mb-3 text-sm text-slate-500">
          คุณเป็นผู้สำรองจ่าย เลือกตัวเองด้วยหากมีส่วนในบิลนี้
          หากเป็นเงินยืมให้เลือกเฉพาะผู้ยืม
        </p>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {members.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3 p-3">
              <label className="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  name="members"
                  value={m.id}
                  defaultChecked
                  className="h-5 w-5 accent-blue-600"
                />
                <span className="break-words">
                  {m.name}
                  {m.id === me ? " (คุณ)" : ""}
                </span>
              </label>
              {method !== "equal" && (
                <label className="w-32">
                  <span className="sr-only">
                    {method === "exact" ? "ยอดบาท" : "เปอร์เซ็นต์"}ของ {m.name}
                  </span>
                  <input
                    className="field"
                    name={"share_" + m.id}
                    inputMode="decimal"
                    placeholder={method === "exact" ? "บาท" : "เปอร์เซ็นต์"}
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">กำหนดชำระ (เวลาไทย)</span>
          <input className="field" type="date" name="due" />
        </label>
        <label>
          <span className="label">ทวงทุกกี่วัน</span>
          <input
            className="field"
            type="number"
            name="interval"
            min={1}
            max={30}
            defaultValue={3}
          />
        </label>
      </div>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="reminder"
          defaultChecked
          className="mt-1 h-5 w-5 accent-blue-600"
        />
        <span>แจ้งเตือนเมื่อถึงกำหนด และซ้ำตามช่วงที่ตั้งไว้</span>
      </label>
      <p className="text-sm text-slate-500">
        เมื่อบันทึกแล้วจะแก้ยอดไม่ได้ ตรวจส่วนแบ่งก่อนยืนยัน
        เศษสตางค์จากการหารจะกระจายตามลำดับรายชื่อ
      </p>
    </ActionForm>
  );
}
