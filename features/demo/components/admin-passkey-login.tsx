"use client";
import { useRef, useState } from "react";
import { demoApi } from "../demo-api";
import { merchantPasskeyClient } from "../merchant-passkey-client";

export function AdminPasskeyLogin({ registered, onAuthenticated }: { registered: boolean; onAuthenticated: () => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fallback, setFallback] = useState(false);
  const lock = useRef(false);
  const run = async (operation: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await operation(); }
    catch (e) { setError(e instanceof Error ? e.message : "登入未完成，請重試。"); }
    finally { lock.current = false; setPassword(""); setBusy(false); }
  };
  const passkeyLogin = () => run(async () => {
    const result = await merchantPasskeyClient.signIn.passkey({ autoFill: false });
    if (result.error) throw new Error("Passkey 登入未完成。請重試，或使用緊急密碼登入。");
    await onAuthenticated();
  });
  const enroll = () => run(async () => {
    await demoApi.merchantPasskeyEnroll(password);
    const result = await merchantPasskeyClient.passkey.addPasskey({ name: "茶行後台手機", authenticatorAttachment: "platform" });
    if (result.error) throw new Error("Passkey 註冊未完成，請重試。");
    await onAuthenticated();
  });
  return <section aria-label="後台 Passkey 登入" className="mt-6">
    <h2>Face ID／Passkey 登入</h2>
    <p className="muted mt-3">使用這支手機的 Passkey 登入，驗證成功直接進入訂單後台。</p>
    {error && <p role="alert" className="product-draft-alert">{error}</p>}
    {busy && <p role="status">正在等待手機驗證，請完成系統提示…</p>}
    <button className="primary-action mt-4" disabled={busy} onClick={() => void passkeyLogin()}>使用 Face ID／Passkey 登入</button>
    {!registered && <form className="mt-6" onSubmit={e => { e.preventDefault(); if (password) void enroll(); }}>
      <h3>第一次使用：設定手機 Passkey</h3>
      <p className="muted mt-3">只需用授權密碼設定一次，之後使用 Face ID／Passkey 登入。</p>
      <label className="form-field mt-4">首次設定密碼
        <input className="form-input" type="password" autoComplete="current-password" maxLength={128} value={password} disabled={busy} onChange={e => setPassword(e.target.value)} />
      </label>
      <button className="primary-action mt-4" disabled={busy || !password} type="submit">設定這支手機的 Passkey</button>
    </form>}
    <button className="text-button mt-6" disabled={busy} onClick={() => setFallback(!fallback)}>緊急密碼登入</button>
    {fallback && <form onSubmit={e => { e.preventDefault(); if (password) void run(async () => { await demoApi.merchantPasswordLogin(password); await onAuthenticated(); }); }}>
      <label className="form-field mt-4">緊急登入密碼
        <input className="form-input" type="password" autoComplete="current-password" maxLength={128} value={password} disabled={busy} onChange={e => setPassword(e.target.value)} />
      </label>
      <button className="filter-button mt-4" type="submit" disabled={busy || !password}>使用密碼登入</button>
    </form>}
  </section>;
}

