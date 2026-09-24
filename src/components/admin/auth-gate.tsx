"use client";

import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { getFirebaseServices, isDemoMode, isFirebaseConfigured } from "@/lib/firebase";

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(!isDemoMode && isFirebaseConfigured);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isDemoMode || !isFirebaseConfigured) return;
    return onAuthStateChanged(getFirebaseServices().auth, (nextUser) => {
      setUser(nextUser);
      setChecking(false);
    });
  }, []);

  if (isDemoMode) {
    return (
      <>
        <div className="bg-amber-300 px-4 py-2 text-center text-sm font-black text-amber-950">
          ローカルデモモード — Firebaseには接続していません。本番公開では必ず無効にしてください。
        </div>
        {children}
      </>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-100 p-6">
        <section className="w-full max-w-xl border border-slate-200 bg-white p-8 shadow-xl">
          <p className="text-sm font-black tracking-[0.16em] text-blue-700">SETUP REQUIRED</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">Firebaseの設定が必要です</h1>
          <p className="mt-4 leading-7 text-slate-600">
            READMEの「Firebase初期設定」に従ってプロジェクトを作成し、
            <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5">.env.local</code>
            に環境変数を設定してください。
          </p>
        </section>
      </main>
    );
  }

  if (checking) {
    return <main className="grid min-h-dvh place-items-center bg-slate-100 text-lg font-bold text-slate-700">管理者情報を確認中…</main>;
  }

  if (!user) {
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setSubmitting(true);
      setError("");
      try {
        await signInWithEmailAndPassword(getFirebaseServices().auth, email.trim(), password);
      } catch {
        setError("メールアドレスまたはパスワードを確認してください。");
      } finally {
        setSubmitting(false);
      }
    }

    return (
      <main className="grid min-h-dvh place-items-center bg-slate-950 p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md border border-slate-200 bg-white p-8 shadow-2xl">
          <p className="text-sm font-black tracking-[0.16em] text-blue-700">TOSHIN SIGNAGE</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">管理画面にログイン</h1>
          <p className="mt-2 text-slate-600">校舎スタッフ用のアカウントを入力してください。</p>
          <label className="form-label mt-8">
            メールアドレス
            <input className="form-input" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="form-label mt-5">
            パスワード
            <input className="form-input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="mt-4 text-sm font-bold text-red-700">{error}</p>}
          <button className="primary-button mt-7 w-full" disabled={submitting}>
            {submitting ? "ログイン中…" : "ログイン"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-white px-4 py-2 text-right text-sm text-slate-600">
        <span className="mr-4">{user.email}</span>
        <button className="font-bold text-blue-700 underline underline-offset-4" onClick={() => signOut(getFirebaseServices().auth)}>
          ログアウト
        </button>
      </div>
      {children}
    </>
  );
}
