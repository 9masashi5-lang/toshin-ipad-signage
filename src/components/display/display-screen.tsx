"use client";

import { SignageCanvas } from "@/components/display/signage-canvas";
import { useSignage } from "@/hooks/use-signage";

export function DisplayScreen() {
  const { signage, connection, connectionMessage } = useSignage();
  return (
    <main className="fixed inset-0 overflow-hidden bg-slate-950">
      <SignageCanvas signage={signage} />
      {connection !== "live" && (
        <div
          className={`absolute bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2 text-sm font-bold shadow-lg backdrop-blur ${
            connection === "error" ? "bg-red-700/95 text-white" : "bg-slate-950/80 text-white"
          }`}
          role="status"
        >
          {connection === "loading"
            ? "表示データを読み込み中…"
            : connectionMessage || "接続を確認中…"}
        </div>
      )}
    </main>
  );
}
