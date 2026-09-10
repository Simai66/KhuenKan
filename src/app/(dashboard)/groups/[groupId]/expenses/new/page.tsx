import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ExpenseForm } from "@/features/expenses/components/expense-form";
export default async function NewExpense({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { supabase, user } = await requireUser();
  const { data: group, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle();
  if (error) throw error;
  if (!group) notFound();
  const { data: members, error: me } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .is("left_at", null)
    .order("joined_at");
  if (me) throw me;
  const { data: profiles, error: pe } = await supabase
    .from("users")
    .select("id,display_name")
    .in(
      "id",
      members.map((m) => m.user_id),
    );
  if (pe) throw pe;
  return (
    <>
      <header>
        <Link href={"/groups/" + groupId} className="text-sm text-brand">
          {group.name}
        </Link>
        <h1 className="page-title mt-2">เพิ่มบิล / บันทึกหนี้</h1>
      </header>
      <section className="panel max-w-3xl">
        <ExpenseForm
          groupId={groupId}
          me={user.id}
          members={members.map((m) => ({
            id: m.user_id,
            name:
              profiles.find((p) => p.id === m.user_id)?.display_name ||
              "สมาชิก",
          }))}
        />
      </section>
    </>
  );
}
