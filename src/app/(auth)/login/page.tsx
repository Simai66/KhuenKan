import { AuthScreen } from "@/components/auth-screen";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  return <AuthScreen confirmationError={query.error === "confirmation"} />;
}
