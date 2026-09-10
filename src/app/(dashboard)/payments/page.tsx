import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PaymentList } from "@/features/payments/components/payment-list";
export default async function Payments({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const query = await searchParams;
  const page = Math.max(
    1,
    Math.min(10000, Math.floor(Number(query.page)) || 1),
  );
  const { supabase, user } = await requireUser();
  const { data, error, count } = await supabase
    .from("payments")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id")
    .range((page - 1) * 30, page * 30 - 1);
  if (error) throw error;
  const ids = [...new Set(data.flatMap((p) => [p.payer_id, p.payee_id]))];
  const { data: profiles, error: pe } = ids.length
    ? await supabase.from("users").select("id,display_name").in("id", ids)
    : { data: [], error: null };
  if (pe) throw pe;
  return (
    <>
      <header>
        <h1 className="page-title">การชำระเงิน</h1>
        <p className="mt-2 text-slate-500">คำขอชำระและประวัติทั้งหมดของคุณ</p>
      </header>
      <section className="panel">
        <PaymentList
          payments={data}
          me={user.id}
          names={Object.fromEntries(
            (profiles || []).map((p) => [p.id, p.display_name]),
          )}
        />
        <nav
          aria-label="หน้าประวัติ"
          className="mt-5 flex items-center justify-between text-sm"
        >
          {page > 1 ? (
            <Link className="text-brand" href={"/payments?page=" + (page - 1)}>
              ก่อนหน้า
            </Link>
          ) : (
            <span />
          )}
          <span>หน้า {page}</span>
          {page * 30 < (count || 0) ? (
            <Link className="text-brand" href={"/payments?page=" + (page + 1)}>
              ถัดไป
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </section>
    </>
  );
}
