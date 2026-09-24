import type { Metadata } from "next";
import { DisplayScreen } from "@/components/display/display-screen";

export const metadata: Metadata = {
  title: "校舎サイネージ",
  robots: { index: false, follow: false },
};

export default function DisplayPage() {
  return <DisplayScreen />;
}
