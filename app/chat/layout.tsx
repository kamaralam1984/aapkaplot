import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getSession } from "@/lib/auth-server";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/chat");

  return (
    <>
      <Navbar />
      <main className="bg-surface-subtle">{children}</main>
    </>
  );
}
