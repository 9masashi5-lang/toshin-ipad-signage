import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AuthGate } from "@/components/admin/auth-gate";

export const metadata: Metadata = {
  title: "サイネージ管理 | 東進",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AuthGate><AdminDashboard /></AuthGate>;
}
