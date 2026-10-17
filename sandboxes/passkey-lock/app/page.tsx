"use client";
import { useEffect, useState } from "react";
import { authClient } from "../lib/auth-client";
type Bridge = { authenticated: boolean; userId: string | null; merchantAllowed: boolean };
export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bridge, setBridge] = useState<Bridge>({ authenticated: false, userId: null, merchantAllowed: false });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const refresh = async () => {
    const response = await fetch("/api/merchant-session", { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new Error();
    setBridge(await response.json() as Bridge);
  };
  useEffect(() => { void refresh().catch(() => setError("無法讀取沙盒狀態")); }, []);
  const run = async (operation: () => Promise<{ error?: unknown }>, success: string) => {
    setBusy(true); setMessage(""); setError("");
    try {
      const result = await operation();
      if (result.error) throw new Error();
      setPassword(""); await refresh(); setMessage(success);
    } catch { setError("操作未完成。請重新嘗試或確認沙盒設定。"); }
    finally { setPassword(""); setBusy(false); }
  };
  return <main>
    <h1>Passkey 鎖頭沙盒</h1>
    <p className="notice">獨立驗收環境。帳號由授權管理員建立，未連接茶行訂單。</p>
    <p role="status">{bridge.authenticated ? "已登入" : "未登入"} · 商家白名單：{bridge.merchantAllowed ? "允許" : "未允許"}</p>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!bridge.authenticated && <section>
      <h2>首次設定</h2>
      <label>沙盒帳號<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>初次設定密碼<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
      <button disabled={busy || !email || !password} onClick={() => void run(() => authClient.signIn.email({ email, password }), "首次設定登入成功")}>初次設定登入</button>
    </section>}
    {bridge.authenticated && <>
      <button disabled={busy} onClick={() => void run(() => authClient.passkey.addPasskey({ name: "手機 Passkey", authenticatorAttachment: "platform" }), "Passkey 已註冊")}>註冊手機 Passkey</button>
      <button disabled={busy} onClick={() => void run(() => authClient.signOut(), "已登出")}>登出</button>
    </>}
    {!bridge.authenticated && <button disabled={busy} onClick={() => void run(() => authClient.signIn.passkey({ autoFill: false }), "Passkey 登入成功")}>使用 Passkey 登入</button>}
    <button disabled={busy} onClick={() => void refresh().catch(() => setError("無法讀取沙盒狀態"))}>重新整理狀態</button>
  </main>;
}
