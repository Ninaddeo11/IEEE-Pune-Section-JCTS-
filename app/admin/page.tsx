import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { configured } from "@/lib/db";
import Login from "@/components/admin/login";
export const metadata = {
  title: "Chapter workspace",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function AdminLogin() {
  if (await currentUser()) redirect("/admin/dashboard");
  return <Login configured={configured()} />;
}
