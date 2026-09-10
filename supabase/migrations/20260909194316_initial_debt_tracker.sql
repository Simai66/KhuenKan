-- All financial writes go through narrow RPCs. Private definer functions are
-- explicit privilege boundaries: no caller-supplied actor IDs, fixed search_path.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
alter default privileges in schema private revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from public;

create table public.users (
 id uuid primary key references auth.users(id) on delete restrict,
 display_name text not null check(length(display_name) between 1 and 80),
 avatar_path text, timezone text not null default 'Asia/Bangkok',
 reminders_enabled boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.groups (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 100),
 kind text not null default 'group' check(kind in ('group','direct')),
 created_by uuid not null references public.users(id), currency text not null default 'THB' check(currency='THB'),
 invite_code uuid not null unique default gen_random_uuid(), archived_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.group_members (
 group_id uuid references public.groups(id) on delete restrict, user_id uuid references public.users(id) on delete restrict,
 role text not null default 'member' check(role in ('owner','admin','member')),
 joined_at timestamptz not null default now(), left_at timestamptz,
 primary key(group_id,user_id)
);
create unique index one_group_owner on public.group_members(group_id) where role='owner' and left_at is null;
create index member_user_idx on public.group_members(user_id, group_id);
create table public.expenses (
 id uuid primary key default gen_random_uuid(), group_id uuid not null references public.groups(id),
 created_by uuid not null references public.users(id), paid_by uuid not null references public.users(id),
 title text not null check(length(title) between 1 and 150), description text,
 total_amount_minor bigint not null check(total_amount_minor>0 and total_amount_minor<=10000000000),
 split_method text not null check(split_method in ('equal','exact','percentage')),
 expense_date date not null default current_date, due_at timestamptz,
 receipt_path text, status text not null default 'posted' check(status in ('draft','posted','void')),
 reminder_enabled boolean not null default true,
 reminder_interval_days integer not null default 3 check(reminder_interval_days between 1 and 30),
 check(not reminder_enabled or due_at is not null),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index expenses_group_idx on public.expenses(group_id, expense_date desc);
create table public.expense_splits (
 id uuid primary key default gen_random_uuid(), expense_id uuid not null references public.expenses(id),
 user_id uuid not null references public.users(id), amount_minor bigint not null check(amount_minor>=0),
 percentage numeric(7,4) check(percentage between 0 and 100), next_reminder_at timestamptz,
 created_at timestamptz not null default now(), unique(expense_id,user_id)
);
create index splits_user_idx on public.expense_splits(user_id);
create table public.payments (
 id uuid primary key default gen_random_uuid(), expense_split_id uuid not null references public.expense_splits(id),
 payer_id uuid not null references public.users(id), payee_id uuid not null references public.users(id),
 amount_minor bigint not null check(amount_minor>0),
 method text not null default 'promptpay' check(method in ('promptpay','bank_transfer','cash')),
 status text not null default 'pending' check(status in ('pending','submitted','confirmed','rejected','expired','cancelled')),
 slip_path text, provider text, provider_payment_id text, idempotency_key uuid not null unique,
 verification_source text check(verification_source in ('recipient','provider')),
 confirmed_by uuid references public.users(id), confirmed_at timestamptz,
 expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(payer_id<>payee_id), unique(provider,provider_payment_id)
);
create index payments_split_idx on public.payments(expense_split_id,status);
create index payments_payee_idx on public.payments(payee_id,created_at desc);
create index payments_payer_idx on public.payments(payer_id,created_at desc);
-- One live request per split: a submitted transfer must be reviewed before retrying.
create unique index one_active_payment on public.payments(expense_split_id) where status in ('pending','submitted');
create table public.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id),
 expense_split_id uuid references public.expense_splits(id), payment_id uuid references public.payments(id),
 type text not null check(type in ('debt_created','payment_due','payment_submitted','payment_confirmed')),
 channel text not null default 'in_app' check(channel='in_app'), payload jsonb not null default '{}',
 status text not null default 'sent' check(status in ('queued','processing','sent','failed','cancelled')),
 dedupe_key text not null unique, scheduled_at timestamptz not null default now(), locked_at timestamptz,
 attempts integer not null default 0, last_error text, sent_at timestamptz default now(), read_at timestamptz,
 created_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications(user_id,created_at desc);
create index reminder_due_idx on public.expense_splits(next_reminder_at) where next_reminder_at is not null;
create table private.user_payment_accounts (
 user_id uuid primary key references public.users(id), promptpay_type text not null check(promptpay_type in ('phone','national_id')),
 promptpay_value_encrypted text not null, account_name text not null check(length(account_name) between 1 and 100),
 updated_at timestamptz not null default now()
);
alter table private.user_payment_accounts enable row level security;
revoke all on private.user_payment_accounts from public, anon, authenticated;

create function private.on_signup() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.users(id,display_name) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),'ผู้ใช้'),80));
 return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.on_signup();
-- Backfill accounts created before migration without importing email into public profiles.
insert into public.users(id,display_name) select id,left(coalesce(nullif(trim(raw_user_meta_data->>'display_name'),''),'ผู้ใช้'),80) from auth.users on conflict(id) do nothing;

create function private.is_member(g uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.group_members where group_id=g and user_id=auth.uid() and left_at is null)
$$;
create function private.can_read_expense(e uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.expenses x where x.id=e and
 (private.is_member(x.group_id) or x.paid_by=auth.uid() or exists(select 1 from public.expense_splits s where s.expense_id=e and s.user_id=auth.uid())))
$$;
create function private.can_read_profile(u uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (u=auth.uid() or exists(select 1 from public.group_members a join public.group_members b using(group_id) where a.user_id=auth.uid() and b.user_id=u and a.left_at is null and b.left_at is null)
 or exists(select 1 from public.expenses e join public.expense_splits s on s.expense_id=e.id where (e.paid_by=auth.uid() and s.user_id=u) or (s.user_id=auth.uid() and e.paid_by=u)))
$$;
grant execute on function private.is_member(uuid), private.can_read_expense(uuid), private.can_read_profile(uuid) to authenticated;

alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
revoke all on public.users,public.groups,public.group_members,public.expenses,public.expense_splits,public.payments,public.notifications from public,anon,authenticated;
grant select on public.users,public.groups,public.group_members,public.expenses,public.expense_splits,public.payments,public.notifications to authenticated;
create policy users_read on public.users for select to authenticated using(private.can_read_profile(id));
create policy groups_read on public.groups for select to authenticated using(private.is_member(id));
create policy members_read on public.group_members for select to authenticated using(user_id=auth.uid() or private.is_member(group_id));
create policy expenses_read on public.expenses for select to authenticated using(private.can_read_expense(id));
create policy splits_read on public.expense_splits for select to authenticated using(private.can_read_expense(expense_id));
create policy payments_read on public.payments for select to authenticated using(payer_id=auth.uid() or payee_id=auth.uid());
create policy notifications_read on public.notifications for select to authenticated using(user_id=auth.uid());

create function private.create_group(p_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare g uuid;
begin
 if auth.uid() is null then raise exception 'กรุณาเข้าสู่ระบบ'; end if;
 insert into public.groups(name,created_by) values(trim(p_name),auth.uid()) returning id into g;
 insert into public.group_members(group_id,user_id,role) values(g,auth.uid(),'owner'); return g;
end $$;
create function private.join_group(p_code uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare g uuid;
begin
 if auth.uid() is null then raise exception 'กรุณาเข้าสู่ระบบ'; end if;
 select id into g from public.groups where invite_code=p_code and archived_at is null and kind='group' for update;
 if g is null then raise exception 'รหัสกลุ่มไม่ถูกต้อง'; end if;
 insert into public.group_members(group_id,user_id) values(g,auth.uid()) on conflict(group_id,user_id) do update set left_at=null;
 return g;
end $$;
create function private.create_expense(p_group uuid,p_title text,p_total bigint,p_method text,p_splits jsonb,p_due timestamptz,p_reminder boolean,p_interval integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare e uuid; item jsonb; s uuid; member_id uuid; total bigint=0; count_rows integer=0;
begin
 if not private.is_member(p_group) or not exists(select 1 from public.groups where id=p_group and archived_at is null) then raise exception 'ไม่มีสิทธิ์สร้างบิลในกลุ่มนี้'; end if;
 if jsonb_typeof(p_splits)<>'array' or jsonb_array_length(p_splits) not between 1 and 100 then raise exception 'ต้องมีผู้แบ่งบิล 1–100 คน'; end if;
 insert into public.expenses(group_id,created_by,paid_by,title,total_amount_minor,split_method,due_at,reminder_enabled,reminder_interval_days)
 values(p_group,auth.uid(),auth.uid(),trim(p_title),p_total,p_method,p_due,coalesce(p_reminder,false),p_interval) returning id into e;
 for item in select * from jsonb_array_elements(p_splits) loop
 member_id=(item->>'user_id')::uuid;
 if not exists(select 1 from public.group_members where group_id=p_group and user_id=member_id and left_at is null) then raise exception 'ผู้แบ่งบิลต้องเป็นสมาชิกกลุ่ม'; end if;
 insert into public.expense_splits(expense_id,user_id,amount_minor,percentage,next_reminder_at)
 values(e,member_id,(item->>'amount_minor')::bigint,(item->>'percentage')::numeric,
 case when p_reminder and member_id<>auth.uid() then p_due else null end) returning id into s;
 total=total+(item->>'amount_minor')::bigint; count_rows=count_rows+1;
 if member_id<>auth.uid() and (item->>'amount_minor')::bigint>0 then
 insert into public.notifications(user_id,expense_split_id,type,payload,dedupe_key) values(member_id,s,'debt_created',jsonb_build_object('title',p_title),'debt:'||s::text);
 end if;
 end loop;
 if total<>p_total then raise exception 'ผลรวมส่วนแบ่งไม่เท่ากับยอดบิล'; end if;
 return e;
end $$;
create function private.void_expense(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare e public.expenses;
begin
 select * into e from public.expenses where id=p_id for update;
 if auth.uid() is null or e.created_by is distinct from auth.uid() then raise exception 'ไม่มีสิทธิ์ยกเลิกบิล'; end if;
 -- Lock splits in the same order as payment creation; reject any active or settled transfer.
 perform id from public.expense_splits where expense_id=p_id order by id for update;
 if exists(select 1 from public.payments p join public.expense_splits s on s.id=p.expense_split_id where s.expense_id=p_id and p.status in ('pending','submitted','confirmed')) then raise exception 'มีรายการชำระอยู่ ยกเลิกบิลไม่ได้'; end if;
 update public.expenses set status='void',updated_at=now() where id=p_id;
 update public.expense_splits set next_reminder_at=null where expense_id=p_id;
end $$;

-- Read summary using a narrow definer RPC so private payment rows need not be
-- exposed to every group member. Caller must still be allowed to read the bill.
create function private.balances() returns table(split_id uuid,expense_id uuid,group_id uuid,title text,user_id uuid,paid_by uuid,amount_minor bigint,paid_minor bigint,remaining_minor bigint,due_at timestamptz,status text)
language sql stable security definer set search_path='' as $$
 select s.id,e.id,e.group_id,e.title,s.user_id,e.paid_by,s.amount_minor,coalesce(p.paid,0)::bigint,
 case when s.user_id=e.paid_by or e.status<>'posted' then 0 else s.amount_minor-coalesce(p.paid,0) end::bigint,e.due_at,e.status
 from public.expense_splits s join public.expenses e on e.id=s.expense_id
 left join lateral(select sum(amount_minor) paid from public.payments where expense_split_id=s.id and status='confirmed')p on true
 where private.can_read_expense(e.id)
$$;
create function private.begin_payment(p_split uuid,p_amount bigint,p_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare s public.expense_splits; e public.expenses; p public.payments; paid bigint; result uuid;
begin
 if auth.uid() is null then raise exception 'กรุณาเข้าสู่ระบบ'; end if;
 -- Lock parent first, then split. All financial mutations use this order.
 select e0.* into e from public.expenses e0 join public.expense_splits s0 on s0.expense_id=e0.id where s0.id=p_split for update of e0;
 select * into s from public.expense_splits where id=p_split for update;
 if s.user_id is distinct from auth.uid() or e.paid_by=auth.uid() or e.status<>'posted' then raise exception 'ไม่มีสิทธิ์ชำระรายการนี้'; end if;
 select * into p from public.payments where idempotency_key=p_key;
 if p.id is not null then
 if p.payer_id=auth.uid() and p.expense_split_id=p_split and p.amount_minor=p_amount then return p.id; end if;
 raise exception 'คำขอซ้ำไม่ตรงกับรายการเดิม'; end if;
 update public.payments set status='expired',updated_at=now() where expense_split_id=p_split and status='pending' and expires_at<=now();
 if exists(select 1 from public.payments where expense_split_id=p_split and status in ('pending','submitted')) then raise exception 'มีรายการชำระที่ยังไม่สิ้นสุด กรุณาเปิดจากหน้าการชำระเงิน'; end if;
 select coalesce(sum(amount_minor),0) into paid from public.payments where expense_split_id=p_split and status='confirmed';
 if p_amount is null or p_amount<=0 or p_amount>s.amount_minor-paid then raise exception 'ยอดชำระเกินยอดค้างหรือไม่ถูกต้อง'; end if;
 insert into public.payments(expense_split_id,payer_id,payee_id,amount_minor,idempotency_key,expires_at) values(p_split,auth.uid(),e.paid_by,p_amount,p_key,now()+interval '24 hours') returning id into result;
 return result;
end $$;
create function private.submit_payment(p_id uuid,p_path text) returns void language plpgsql security definer set search_path='' as $$
declare p public.payments;
begin
 select * into p from public.payments where id=p_id for update;
 if auth.uid() is null or p.payer_id is distinct from auth.uid() or p.status<>'pending' or p.expires_at<=now() then raise exception 'รายการนี้ส่งหลักฐานไม่ได้หรือหมดอายุแล้ว'; end if;
 if p_path is null or not exists(select 1 from storage.objects where bucket_id='payment-slips' and name=p_path and split_part(name,'/',1)=p_id::text and owner_id=auth.uid()::text) then raise exception 'ไม่พบหลักฐานของรายการนี้'; end if;
 update public.payments set status='submitted',slip_path=p_path,updated_at=now() where id=p_id;
 insert into public.notifications(user_id,payment_id,type,payload,dedupe_key) values(p.payee_id,p_id,'payment_submitted',jsonb_build_object('amount_minor',p.amount_minor),'submit:'||p_id::text);
end $$;
create function private.review_payment(p_id uuid,p_confirm boolean) returns void language plpgsql security definer set search_path='' as $$
declare p public.payments; s public.expense_splits; e public.expenses; paid bigint;
begin
 if auth.uid() is null then raise exception 'กรุณาเข้าสู่ระบบ'; end if;
 select * into p from public.payments where id=p_id;
 if p.payee_id is distinct from auth.uid() then raise exception 'เฉพาะผู้รับเงินเท่านั้นที่ตรวจรายการได้'; end if;
 select e0.* into e from public.expenses e0 join public.expense_splits s0 on s0.expense_id=e0.id where s0.id=p.expense_split_id for update of e0;
 select * into s from public.expense_splits where id=p.expense_split_id for update;
 select * into p from public.payments where id=p_id for update;
 if (p_confirm and p.status='confirmed') or (not p_confirm and p.status='rejected') then return; end if;
 if p.status<>'submitted' or e.status<>'posted' then raise exception 'รายการนี้ยังไม่รอตรวจสอบ'; end if;
 select coalesce(sum(amount_minor),0) into paid from public.payments where expense_split_id=s.id and status='confirmed';
 if p_confirm and paid+p.amount_minor>s.amount_minor then raise exception 'ยอดชำระรวมเกินยอดค้าง'; end if;
 update public.payments set status=case when p_confirm then 'confirmed' else 'rejected' end,
 confirmed_by=case when p_confirm then auth.uid() else null end,
 confirmed_at=case when p_confirm then now() else null end,
 verification_source=case when p_confirm then 'recipient' else null end,updated_at=now() where id=p_id;
 if p_confirm then
 if paid+p.amount_minor=s.amount_minor then update public.expense_splits set next_reminder_at=null where id=s.id; end if;
 insert into public.notifications(user_id,payment_id,type,payload,dedupe_key) values(p.payer_id,p_id,'payment_confirmed',jsonb_build_object('amount_minor',p.amount_minor),'confirm:'||p_id::text) on conflict(dedupe_key) do nothing;
 end if;
end $$;
create function private.cancel_payment(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'กรุณาเข้าสู่ระบบ'; end if;
 update public.payments set status='cancelled',updated_at=now() where id=p_id and payer_id=auth.uid() and status='pending';
 if not found then raise exception 'ยกเลิกได้เฉพาะรายการของตนเองที่ยังไม่ส่งหลักฐาน'; end if;
end $$;
create function private.save_profile(p_name text,p_reminders boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'กรุณาเข้าสู่ระบบ'; end if;
 update public.users set display_name=trim(p_name),reminders_enabled=p_reminders,updated_at=now() where id=auth.uid();
end $$;
create function private.save_account(p_type text,p_cipher text,p_name text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'กรุณาเข้าสู่ระบบ'; end if;
 if length(p_cipher) not between 30 and 2048 then raise exception 'ข้อมูลบัญชีไม่ถูกต้อง'; end if;
 insert into private.user_payment_accounts(user_id,promptpay_type,promptpay_value_encrypted,account_name) values(auth.uid(),p_type,p_cipher,trim(p_name))
 on conflict(user_id) do update set promptpay_type=excluded.promptpay_type,promptpay_value_encrypted=excluded.promptpay_value_encrypted,account_name=excluded.account_name,updated_at=now();
end $$;
create function private.get_account(p_payment uuid default null) returns table(promptpay_type text,promptpay_value_encrypted text,account_name text)
language plpgsql stable security definer set search_path='' as $$
declare target uuid;
begin
 if auth.uid() is null then raise exception 'กรุณาเข้าสู่ระบบ'; end if;
 if p_payment is null then target=auth.uid(); else
 select payee_id into target from public.payments where id=p_payment and payer_id=auth.uid() and status='pending' and expires_at>now();
 if target is null then raise exception 'ไม่มีสิทธิ์สร้าง QR รายการนี้'; end if;
 end if;
 return query select a.promptpay_type,a.promptpay_value_encrypted,a.account_name from private.user_payment_accounts a where a.user_id=target;
end $$;
create function private.mark_read(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'กรุณาเข้าสู่ระบบ'; end if;
 update public.notifications set read_at=now() where id=p_id and user_id=auth.uid();
end $$;

-- SQL-only in-app reminders: no browser tab, service key, HTTP endpoint or email
-- provider is needed. Row locks + unique event keys make overlapping cron safe.
create function private.send_reminders() returns integer language plpgsql security definer set search_path='' as $$
declare r record; sent integer=0; outstanding bigint;
begin
 for r in select s.id,s.user_id,s.amount_minor,s.next_reminder_at,e.title,e.reminder_interval_days
 from public.expense_splits s join public.expenses e on e.id=s.expense_id join public.users u on u.id=s.user_id
 where e.status='posted' and e.reminder_enabled and u.reminders_enabled and s.user_id<>e.paid_by
 and e.due_at<=now() and s.next_reminder_at<=now()
 order by s.next_reminder_at limit 500 for update of s skip locked loop
 select r.amount_minor-coalesce(sum(amount_minor),0) into outstanding from public.payments where expense_split_id=r.id and status='confirmed';
 if outstanding>0 then
 if not exists(select 1 from public.payments where expense_split_id=r.id and status='submitted') then
 insert into public.notifications(user_id,expense_split_id,type,payload,dedupe_key)
 values(r.user_id,r.id,'payment_due',jsonb_build_object('title',r.title,'amount_minor',outstanding),'due:'||r.id::text||':'||r.next_reminder_at::text)
 on conflict(dedupe_key) do nothing;
 if found then sent=sent+1; end if;
 end if;
 update public.expense_splits set next_reminder_at=now()+make_interval(days=>r.reminder_interval_days) where id=r.id;
 else update public.expense_splits set next_reminder_at=null where id=r.id; end if;
 end loop;
 return sent;
end $$;
revoke all on function private.send_reminders() from public,anon,authenticated;

-- Public wrappers are SECURITY INVOKER, granted only to authenticated. Each
-- private write function authorizes auth.uid() before touching protected data.
create function public.create_group(p_name text) returns uuid language sql security invoker set search_path='' as $$select private.create_group(p_name)$$;
create function public.join_group(p_code uuid) returns uuid language sql security invoker set search_path='' as $$select private.join_group(p_code)$$;
create function public.create_expense(p_group uuid,p_title text,p_total bigint,p_method text,p_splits jsonb,p_due timestamptz,p_reminder boolean,p_interval integer) returns uuid language sql security invoker set search_path='' as $$select private.create_expense(p_group,p_title,p_total,p_method,p_splits,p_due,p_reminder,p_interval)$$;
create function public.void_expense(p_id uuid) returns void language sql security invoker set search_path='' as $$select private.void_expense(p_id)$$;
create function public.balances() returns table(split_id uuid,expense_id uuid,group_id uuid,title text,user_id uuid,paid_by uuid,amount_minor bigint,paid_minor bigint,remaining_minor bigint,due_at timestamptz,status text) language sql security invoker set search_path='' as $$select * from private.balances()$$;
create function public.begin_payment(p_split uuid,p_amount bigint,p_key uuid) returns uuid language sql security invoker set search_path='' as $$select private.begin_payment(p_split,p_amount,p_key)$$;
create function public.submit_payment(p_id uuid,p_path text) returns void language sql security invoker set search_path='' as $$select private.submit_payment(p_id,p_path)$$;
create function public.review_payment(p_id uuid,p_confirm boolean) returns void language sql security invoker set search_path='' as $$select private.review_payment(p_id,p_confirm)$$;
create function public.cancel_payment(p_id uuid) returns void language sql security invoker set search_path='' as $$select private.cancel_payment(p_id)$$;
create function public.save_profile(p_name text,p_reminders boolean) returns void language sql security invoker set search_path='' as $$select private.save_profile(p_name,p_reminders)$$;
create function public.save_account(p_type text,p_cipher text,p_name text) returns void language sql security invoker set search_path='' as $$select private.save_account(p_type,p_cipher,p_name)$$;
create function public.get_account(p_payment uuid default null) returns table(promptpay_type text,promptpay_value_encrypted text,account_name text) language sql security invoker set search_path='' as $$select * from private.get_account(p_payment)$$;
create function public.mark_read(p_id uuid) returns void language sql security invoker set search_path='' as $$select private.mark_read(p_id)$$;
-- Explicit signatures avoid accidentally exposing future functions.
grant execute on function public.create_group(text), private.create_group(text), public.join_group(uuid), private.join_group(uuid),
 public.create_expense(uuid,text,bigint,text,jsonb,timestamptz,boolean,integer), private.create_expense(uuid,text,bigint,text,jsonb,timestamptz,boolean,integer),
 public.void_expense(uuid), private.void_expense(uuid),public.balances(),private.balances(),
 public.begin_payment(uuid,bigint,uuid),private.begin_payment(uuid,bigint,uuid),public.submit_payment(uuid,text),private.submit_payment(uuid,text),
 public.review_payment(uuid,boolean),private.review_payment(uuid,boolean),public.cancel_payment(uuid),private.cancel_payment(uuid),
 public.save_profile(text,boolean),private.save_profile(text,boolean),public.save_account(text,text,text),private.save_account(text,text,text),
 public.get_account(uuid),private.get_account(uuid),public.mark_read(uuid),private.mark_read(uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('payment-slips','payment-slips',false,5242880,array['image/jpeg','image/png','image/webp']),
 ('receipts','receipts',false,5242880,array['image/jpeg','image/png','image/webp']),
 ('avatars','avatars',false,2097152,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy slip_insert on storage.objects for insert to authenticated with check(
 bucket_id='payment-slips' and owner_id=auth.uid()::text and exists(select 1 from public.payments p where p.id::text=split_part(name,'/',1) and p.payer_id=auth.uid() and p.status='pending' and p.expires_at>now())
);
create policy slip_read on storage.objects for select to authenticated using(
 bucket_id='payment-slips' and exists(select 1 from public.payments p where p.id::text=split_part(name,'/',1) and (p.payer_id=auth.uid() or (p.payee_id=auth.uid() and p.slip_path=name)))
);
-- Receipt/avatar buckets are reserved; no upload/read policies until their UI is implemented.

create function private.dashboard_totals() returns table(payable bigint,receivable bigint,overdue bigint,awaiting_review bigint,confirmed_received bigint,confirmed_paid bigint)
language sql stable security definer set search_path='' as $$
 select coalesce(sum(b.remaining_minor) filter(where b.user_id=auth.uid()),0)::bigint,
 coalesce(sum(b.remaining_minor) filter(where b.paid_by=auth.uid()),0)::bigint,
 coalesce(sum(b.remaining_minor) filter(where b.user_id=auth.uid() and b.due_at<now()),0)::bigint,
 (select count(*) from public.payments where payee_id=auth.uid() and status='submitted'),
 (select coalesce(sum(amount_minor),0)::bigint from public.payments where payee_id=auth.uid() and status='confirmed'),
 (select coalesce(sum(amount_minor),0)::bigint from public.payments where payer_id=auth.uid() and status='confirmed')
 from private.balances() b where auth.uid() is not null and (b.user_id=auth.uid() or b.paid_by=auth.uid())
$$;
create function public.dashboard_totals() returns table(payable bigint,receivable bigint,overdue bigint,awaiting_review bigint,confirmed_received bigint,confirmed_paid bigint)
language sql security invoker set search_path='' as $$select * from private.dashboard_totals()$$;
grant execute on function private.dashboard_totals(),public.dashboard_totals() to authenticated;

-- Supabase projects may have existing default grants to anon; remove them
-- explicitly for every function owned by this application, not extension APIs.
do $$declare f record;begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='public' and p.proname in ('create_group','join_group','create_expense','void_expense','balances','begin_payment','submit_payment','review_payment','cancel_payment','save_profile','save_account','get_account','mark_read','dashboard_totals')) or (n.nspname='private' and p.proname in ('on_signup','is_member','can_read_expense','can_read_profile','create_group','join_group','create_expense','void_expense','balances','begin_payment','submit_payment','review_payment','cancel_payment','save_profile','save_account','get_account','mark_read','send_reminders','dashboard_totals'))
 loop execute format('revoke all on function %s from public, anon',f.signature); end loop;
end $$;
