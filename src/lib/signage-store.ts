import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseServices, isDemoMode, isFirebaseConfigured } from "@/lib/firebase";
import {
  defaultSignageState,
  normalizeSignageState,
  type SignageState,
} from "@/types/signage";

const CURRENT_DOCUMENT = "signage/current";
const CACHE_KEY = "toshin-signage:last-state";
const DEMO_CHANNEL = "toshin-signage:updates";

export type ConnectionState = "loading" | "live" | "cached" | "error";
type StatePatch = Partial<Pick<SignageState, "mode" | "ranking" | "notice" | "countdown">>;

function readCachedState(): SignageState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? normalizeSignageState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function cacheState(state: SignageState) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing may block storage. Firestore remains authoritative.
  }
}

function subscribeDemo(
  onData: (state: SignageState) => void,
  onConnectionChange: (state: ConnectionState, message?: string) => void,
) {
  const initial = readCachedState() ?? defaultSignageState;
  cacheState(initial);
  onData(initial);
  onConnectionChange("live");
  const channel =
    typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(DEMO_CHANNEL);
  const receive = () => onData(readCachedState() ?? defaultSignageState);
  channel?.addEventListener("message", receive);
  window.addEventListener("storage", receive);
  return () => {
    channel?.removeEventListener("message", receive);
    channel?.close();
    window.removeEventListener("storage", receive);
  };
}

export function subscribeToSignage(
  onData: (state: SignageState) => void,
  onConnectionChange: (state: ConnectionState, message?: string) => void,
) {
  if (isDemoMode) return subscribeDemo(onData, onConnectionChange);
  const cached = readCachedState();
  if (cached) {
    onData(cached);
    onConnectionChange("cached", "接続を確認しています");
  } else {
    onConnectionChange("loading");
  }

  if (!isFirebaseConfigured) {
    onConnectionChange("error", "Firebaseの設定が必要です");
    return () => undefined;
  }

  const { db } = getFirebaseServices();
  return onSnapshot(
    doc(db, CURRENT_DOCUMENT),
    { includeMetadataChanges: true },
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(cached ?? defaultSignageState);
        onConnectionChange("live", "表示データが未作成のため初期表示を使用しています");
        return;
      }
      const state = normalizeSignageState(snapshot.data());
      cacheState(state);
      onData(state);
      onConnectionChange(snapshot.metadata.fromCache ? "cached" : "live");
    },
    () => {
      const fallback = readCachedState();
      if (fallback) {
        onData(fallback);
        onConnectionChange("cached", "通信が不安定です。最後に取得した表示を継続しています");
      } else {
        onConnectionChange("error", "表示データを取得できません。通信環境を確認してください");
      }
    },
  );
}

export async function updateSignage(patch: StatePatch) {
  const next = normalizeSignageState({
    ...(readCachedState() ?? defaultSignageState),
    ...patch,
    updatedAt: new Date().toISOString(),
  });

  if (isDemoMode) {
    cacheState(next);
    const channel =
      typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(DEMO_CHANNEL);
    channel?.postMessage("updated");
    channel?.close();
    window.dispatchEvent(new StorageEvent("storage", { key: CACHE_KEY }));
    return;
  }
  const { db } = getFirebaseServices();
  const { updatedAt: _cachedUpdatedAt, ...completeState } = next;
  void _cachedUpdatedAt;
  await setDoc(doc(db, CURRENT_DOCUMENT), {
    ...completeState,
    updatedAt: serverTimestamp(),
  });
}
