// Hand-maintained typed API contract matching the migrations.
// npm run db:types produces a separate Supabase introspection file for review.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type UserRow = {
  id: string;
  display_name: string;
  avatar_path: string | null;
  timezone: string;
  reminders_enabled: boolean;
  created_at: string;
  updated_at: string;
};
export type GroupRow = {
  id: string;
  name: string;
  kind: string;
  created_by: string;
  currency: string;
  invite_code: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};
export type MemberRow = {
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  left_at: string | null;
};
export type ExpenseRow = {
  id: string;
  group_id: string;
  created_by: string;
  paid_by: string;
  title: string;
  description: string | null;
  total_amount_minor: number;
  split_method: string;
  expense_date: string;
  due_at: string | null;
  receipt_path: string | null;
  status: string;
  reminder_enabled: boolean;
  reminder_interval_days: number;
  created_at: string;
  updated_at: string;
};
export type SplitRow = {
  id: string;
  expense_id: string;
  user_id: string;
  amount_minor: number;
  percentage: number | null;
  next_reminder_at: string | null;
  created_at: string;
};
export type PaymentRow = {
  id: string;
  expense_split_id: string;
  payer_id: string;
  payee_id: string;
  amount_minor: number;
  method: string;
  status: string;
  slip_path: string | null;
  provider: string | null;
  provider_payment_id: string | null;
  idempotency_key: string;
  verification_source: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};
export type NotificationRow = {
  id: string;
  user_id: string;
  expense_split_id: string | null;
  payment_id: string | null;
  type: string;
  channel: string;
  payload: Json;
  status: string;
  dedupe_key: string;
  scheduled_at: string;
  locked_at: string | null;
  attempts: number;
  last_error: string | null;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
};
export type BalanceRow = {
  split_id: string;
  expense_id: string;
  group_id: string;
  title: string;
  user_id: string;
  paid_by: string;
  amount_minor: number;
  paid_minor: number;
  remaining_minor: number;
  due_at: string | null;
  status: string;
};
type Table<R> = {
  Row: R;
  Insert: Partial<R>;
  Update: Partial<R>;
  Relationships: [];
};
type Fn<A, R> = { Args: A; Returns: R };
export type Database = {
  public: {
    Tables: {
      users: Table<UserRow>;
      groups: Table<GroupRow>;
      group_members: Table<MemberRow>;
      expenses: Table<ExpenseRow>;
      expense_splits: Table<SplitRow>;
      payments: Table<PaymentRow>;
      notifications: Table<NotificationRow>;
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Functions: {
      dashboard_totals: Fn<
        Record<string, never>,
        {
          payable: number;
          receivable: number;
          overdue: number;
          awaiting_review: number;
          confirmed_received: number;
          confirmed_paid: number;
        }[]
      >;
      create_group: Fn<{ p_name: string }, string>;
      join_group: Fn<{ p_code: string }, string>;
      create_expense: Fn<
        {
          p_group: string;
          p_title: string;
          p_total: number;
          p_method: string;
          p_splits: Json;
          p_due: string | null;
          p_reminder: boolean;
          p_interval: number;
        },
        string
      >;
      void_expense: Fn<{ p_id: string }, undefined>;
      balances: Fn<Record<string, never>, BalanceRow[]>;
      begin_payment: Fn<
        { p_split: string; p_amount: number; p_key: string },
        string
      >;
      submit_payment: Fn<{ p_id: string; p_path: string }, undefined>;
      review_payment: Fn<{ p_id: string; p_confirm: boolean }, undefined>;
      cancel_payment: Fn<{ p_id: string }, undefined>;
      save_profile: Fn<{ p_name: string; p_reminders: boolean }, undefined>;
      save_account: Fn<
        { p_type: string; p_cipher: string; p_name: string },
        undefined
      >;
      get_account: Fn<
        { p_payment?: string | null },
        {
          promptpay_type: string;
          promptpay_value_encrypted: string;
          account_name: string;
        }[]
      >;
      mark_read: Fn<{ p_id: string }, undefined>;
    };
  };
};
