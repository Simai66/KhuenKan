"use client";
import { useActionState } from "react";
export type FormState = { error?: string; success?: string };
export type FormAction = (
  state: FormState,
  data: FormData,
) => Promise<FormState>;
export function ActionForm({
  action,
  children,
  label = "บันทึก",
  className = "space-y-4",
}: {
  action: FormAction;
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      <fieldset disabled={pending} className="min-w-0 space-y-4">
        {children}
      </fieldset>
      {state.error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
        >
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {state.success}
        </p>
      )}
      <button className="btn" disabled={pending}>
        {pending ? "กำลังดำเนินการ…" : label}
      </button>
    </form>
  );
}
