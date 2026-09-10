import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
// PostgreSQL engine, real RLS/roles and transactions. Auth/Storage tables are
// minimal fixtures; this does not simulate the Supabase HTTP services or Cron.
await db.exec(`
 create role anon nologin; create role authenticated nologin;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,public,storage to authenticated,anon;
 grant execute on function auth.uid() to authenticated,anon;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);
 alter table storage.objects enable row level security;
 grant select,insert on storage.objects to authenticated;
 -- Mimic permissive Supabase defaults; migration must explicitly revoke anon.
 alter default privileges in schema public grant execute on functions to anon;
`);
const initial = readdirSync("supabase/migrations").find((n) =>
  n.endsWith("_initial_debt_tracker.sql"),
);
await db.exec(readFileSync("supabase/migrations/" + initial, "utf8"));
const A = "00000000-0000-4000-8000-000000000001";
const B = "00000000-0000-4000-8000-000000000002";
const C = "00000000-0000-4000-8000-000000000003";
for (const [id, name] of [
  [A, "เจ้าหนี้"],
  [B, "ลูกหนี้"],
  [C, "คนนอก"],
])
  await db.query(
    "insert into auth.users(id,raw_user_meta_data) values($1,$2)",
    [id, JSON.stringify({ display_name: name })],
  );
async function as(id, sql, args = []) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  try {
    return await db.query(sql, args);
  } finally {
    await db.exec("reset role");
    await db.exec("select set_config('request.jwt.claim.sub','',false)");
  }
}
let passed = 0;
async function check(label, fn) {
  await fn();
  passed++;
  console.log("PASS", label);
}
let group, expense, split, payment;
await check("Anonymous cannot execute public RPCs", async () => {
  await db.exec("set role anon");
  try {
    await assert.rejects(
      () => db.query("select public.create_group('hacked')"),
      /permission denied/,
    );
  } finally {
    await db.exec("reset role");
  }
});
await check(
  "Auth signup creates profiles and outsider sees only own row",
  async () => {
    assert.equal((await as(C, "select * from public.users")).rows.length, 1);
  },
);
await check("Create group is atomic and creates owner", async () => {
  group = (await as(A, "select public.create_group('ทริปเพื่อน') id")).rows[0]
    .id;
  assert.equal(
    (await as(A, "select role from public.group_members")).rows[0].role,
    "owner",
  );
});
await check(
  "Outsider cannot view group or self-insert membership",
  async () => {
    assert.equal((await as(C, "select * from public.groups")).rows.length, 0);
    await assert.rejects(
      () =>
        as(
          C,
          "insert into public.group_members(group_id,user_id) values($1,$2)",
          [group, C],
        ),
      /permission denied/,
    );
  },
);
await check("Join by valid invite code only", async () => {
  const code = (await as(A, "select invite_code from public.groups")).rows[0]
    .invite_code;
  await as(B, "select public.join_group($1)", [code]);
  await assert.rejects(
    () => as(C, "select public.join_group($1)", [C]),
    /รหัสกลุ่ม/,
  );
});
await check("Invalid split sum rolls back entire bill", async () => {
  await assert.rejects(
    () =>
      as(
        A,
        "select public.create_expense($1,'ผิด',10000,'exact',$2,now(),true,3)",
        [group, JSON.stringify([{ user_id: B, amount_minor: 9999 }])],
      ),
    /ผลรวม/,
  );
  assert.equal((await as(A, "select * from public.expenses")).rows.length, 0);
});
await check("Nonmember cannot be assigned a debt", async () => {
  await assert.rejects(
    () =>
      as(
        A,
        "select public.create_expense($1,'ผิด',10000,'exact',$2,now(),true,3)",
        [group, JSON.stringify([{ user_id: C, amount_minor: 10000 }])],
      ),
    /สมาชิกกลุ่ม/,
  );
});
await check("Bill creation, creator share and exact total", async () => {
  expense = (
    await as(
      A,
      "select public.create_expense($1,'อาหาร',10000,'equal',$2,now()-interval '1 day',true,3) id",
      [
        group,
        JSON.stringify([
          { user_id: A, amount_minor: 5000 },
          { user_id: B, amount_minor: 5000 },
        ]),
      ],
    )
  ).rows[0].id;
  const b = (await as(B, "select * from public.balances()")).rows;
  assert.equal(Number(b.find((x) => x.user_id === A).remaining_minor), 0);
  assert.equal(Number(b.find((x) => x.user_id === B).remaining_minor), 5000);
  split = b.find((x) => x.user_id === B).split_id;
});
await check(
  "RLS hides expenses/splits/balances/notifications from outsider",
  async () => {
    for (const table of ["expenses", "expense_splits", "notifications"])
      assert.equal(
        (await as(C, "select * from public." + table)).rows.length,
        0,
      );
    assert.equal(
      (await as(C, "select * from public.balances()")).rows.length,
      0,
    );
  },
);
await check("Client cannot mutate ledger or call reminder worker", async () => {
  await assert.rejects(
    () => as(B, "update public.expense_splits set amount_minor=0"),
    /permission denied/,
  );
  await assert.rejects(
    () => as(B, "select private.send_reminders()"),
    /permission denied/,
  );
});
await check("Reminders deduplicate and respect opted-out users", async () => {
  await as(B, "select public.save_profile('ลูกหนี้',false)");
  assert.equal(
    (await db.query("select private.send_reminders() n")).rows[0].n,
    0,
  );
  await as(B, "select public.save_profile('ลูกหนี้',true)");
  assert.equal(
    (await db.query("select private.send_reminders() n")).rows[0].n,
    1,
  );
  assert.equal(
    (await db.query("select private.send_reminders() n")).rows[0].n,
    0,
  );
});
await check(
  "Only debtor can initiate and amount cannot exceed balance",
  async () => {
    await assert.rejects(
      () =>
        as(C, "select public.begin_payment($1,1000,gen_random_uuid())", [
          split,
        ]),
      /สิทธิ์/,
    );
    await assert.rejects(
      () =>
        as(B, "select public.begin_payment($1,5001,gen_random_uuid())", [
          split,
        ]),
      /ยอด/,
    );
  },
);
await check(
  "Partial payment creation is idempotent and active duplicates fail",
  async () => {
    const key = "00000000-0000-4000-8000-000000000010";
    payment = (
      await as(B, "select public.begin_payment($1,2000,$2) id", [split, key])
    ).rows[0].id;
    assert.equal(
      (await as(B, "select public.begin_payment($1,2000,$2) id", [split, key]))
        .rows[0].id,
      payment,
    );
    await assert.rejects(
      () =>
        as(B, "select public.begin_payment($1,1000,gen_random_uuid())", [
          split,
        ]),
      /รายการชำระ/,
    );
    assert.equal((await as(C, "select * from public.payments")).rows.length, 0);
  },
);
await check("Balances do not deduct pending payments", async () => {
  assert.equal(
    Number(
      (await as(B, "select * from public.dashboard_totals()")).rows[0].payable,
    ),
    5000,
  );
});
await check(
  "Storage forbids outsider upload and requires real object before submit",
  async () => {
    await assert.rejects(
      () =>
        as(
          C,
          "insert into storage.objects(bucket_id,name,owner_id) values('payment-slips',$1,$2)",
          [payment + "/fake.png", C],
        ),
      /row-level security/,
    );
    await assert.rejects(
      () =>
        as(B, "select public.submit_payment($1,$2)", [
          payment,
          payment + "/missing.png",
        ]),
      /หลักฐาน/,
    );
  },
);
await check(
  "Payer uploads slip; recipient can read only submitted attachment",
  async () => {
    const path = payment + "/proof.png";
    await as(
      B,
      "insert into storage.objects(bucket_id,name,owner_id) values('payment-slips',$1,$2)",
      [path, B],
    );
    assert.equal((await as(A, "select * from storage.objects")).rows.length, 0);
    await as(B, "select public.submit_payment($1,$2)", [payment, path]);
    assert.equal((await as(A, "select * from storage.objects")).rows.length, 1);
  },
);
await check(
  "Debtor cannot self-confirm or cancel submitted transfer",
  async () => {
    await assert.rejects(
      () => as(B, "select public.review_payment($1,true)", [payment]),
      /ผู้รับเงิน/,
    );
    await assert.rejects(
      () => as(B, "select public.cancel_payment($1)", [payment]),
      /ยกเลิก/,
    );
  },
);
await check("Reminders pause while recipient reviews", async () => {
  await db.query(
    "update public.expense_splits set next_reminder_at=now()-interval '1 day' where id=$1",
    [split],
  );
  assert.equal(
    (await db.query("select private.send_reminders() n")).rows[0].n,
    0,
  );
});
await check("Confirmation subtracts partial amount exactly once", async () => {
  await as(A, "select public.review_payment($1,true)", [payment]);
  await as(A, "select public.review_payment($1,true)", [payment]);
  assert.equal(
    Number(
      (await as(B, "select * from public.dashboard_totals()")).rows[0].payable,
    ),
    3000,
  );
  assert.equal(
    Number(
      (await as(A, "select * from public.dashboard_totals()")).rows[0]
        .receivable,
    ),
    3000,
  );
});
await check(
  "Settled bill cannot be voided and private account is inaccessible",
  async () => {
    await assert.rejects(
      () => as(A, "select public.void_expense($1)", [expense]),
      /ยกเลิกบิลไม่ได้/,
    );
    await assert.rejects(
      () => as(B, "select * from private.user_payment_accounts"),
      /permission denied/,
    );
  },
);
await check(
  "Account RPC scopes encrypted data to permitted recipient",
  async () => {
    await as(A, "select public.save_account('phone',$1,'เจ้าหนี้')", [
      "v1." + "x".repeat(50),
    ]);
    const p = (
      await as(B, "select public.begin_payment($1,3000,gen_random_uuid()) id", [
        split,
      ])
    ).rows[0].id;
    assert.equal(
      (await as(B, "select * from public.get_account($1)", [p])).rows.length,
      1,
    );
    await assert.rejects(
      () => as(C, "select * from public.get_account($1)", [p]),
      /สิทธิ์/,
    );
    await as(B, "select public.cancel_payment($1)", [p]);
    await assert.rejects(
      () => as(B, "select * from public.get_account($1)", [p]),
      /สิทธิ์/,
    );
  },
);
await check(
  "Full settlement stops reminders and keeps transaction history",
  async () => {
    const p = (
      await as(B, "select public.begin_payment($1,3000,gen_random_uuid()) id", [
        split,
      ])
    ).rows[0].id;
    const path = p + "/proof.png";
    await as(
      B,
      "insert into storage.objects(bucket_id,name,owner_id) values('payment-slips',$1,$2)",
      [path, B],
    );
    await as(B, "select public.submit_payment($1,$2)", [p, path]);
    await as(A, "select public.review_payment($1,true)", [p]);
    assert.equal(
      Number(
        (await as(B, "select * from public.dashboard_totals()")).rows[0]
          .payable,
      ),
      0,
    );
    await db.query(
      "update public.expense_splits set next_reminder_at=now()-interval '1 day' where id=$1",
      [split],
    );
    assert.equal(
      (await db.query("select private.send_reminders() n")).rows[0].n,
      0,
    );
    assert.equal(
      (await as(B, "select * from public.payments where status='confirmed'"))
        .rows.length,
      2,
    );
  },
);
await check("Read notification only affects own row", async () => {
  const n = (await as(B, "select * from public.notifications limit 1")).rows[0];
  await as(C, "select public.mark_read($1)", [n.id]);
  assert.equal(
    (
      await as(B, "select read_at from public.notifications where id=$1", [
        n.id,
      ])
    ).rows[0].read_at,
    null,
  );
  await as(B, "select public.mark_read($1)", [n.id]);
  assert.ok(
    (
      await as(B, "select read_at from public.notifications where id=$1", [
        n.id,
      ])
    ).rows[0].read_at,
  );
});
console.log(
  `${passed} database scenarios passed (PostgreSQL via PGlite; external services not exercised).`,
);
await db.close();
