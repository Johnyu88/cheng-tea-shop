"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { demoApi, type DemoAdminOrder, type DemoLookupSecretRotation, type DemoMerchantStatus, type DemoMerchantChallenge } from "../demo-api";
import { AdminPasskeyLogin } from "./admin-passkey-login";
import { merchantPasskeyClient } from "../merchant-passkey-client";
import { DemoOrderProgress } from "./demo-order-progress";

const statusLabel = { confirmed: "已確認", packed: "已打包", shipped: "已出貨", delivered: "已送達" } as const;

export function AdminOrdersPage() {
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<DemoMerchantChallenge>();
  const [loginStatus, setLoginStatus] = useState<DemoMerchantStatus>();
  const [resendSeconds, setResendSeconds] = useState(0);
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState<DemoAdminOrder[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>();
  const [rotation, setRotation] = useState<{ orderId: string; accessSecret: string }>();
  const [copyMessage, setCopyMessage] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState<{ orderId: string; file: File; previewUrl: string }>();
  const [pendingAudit, setPendingAudit] = useState<{ orderId: string; action: string; label: string }>();
  const [auditReason, setAuditReason] = useState("");
  useEffect(() => {
    let alive = true;
    void demoApi.merchantStatus().then(async status => {
      if (!alive) return;
      setLoginStatus(status);
      if (status.authenticated) {
        const existingOrders = await demoApi.adminOrders();
        if (alive) { setOrders(existingOrders); setAuthenticated(true); }
      }
    })
      .catch(() => { if (alive) setError("無法讀取登入設定，請重新整理。"); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const clearRotation = () => {
    setRotation(undefined);
    setConfirmedOrderId(undefined);
    setCopyMessage("");
  };
  const clearPendingPhoto = () => {
    setPendingPhoto(current => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return undefined;
    });
  };
  const refresh = async () => {
    clearRotation();
    setOrders(await demoApi.adminOrders());
  };
  const sendCode = async () => {
    try {
      setBusy(true);
      const receipt = await demoApi.merchantIssueOtp(phone);
      setChallenge(receipt); setCode(""); setResendSeconds(receipt.resendAfterSeconds); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "驗證碼傳送失敗"); }
    finally { setBusy(false); }
  };
  const resumePasskey = async () => {
    const status = await demoApi.merchantStatus();
    if (!status.authenticated) throw new Error("尚未取得商家權限，請重新登入。");
    setLoginStatus(status); await refresh(); setAuthenticated(true); setError("");
  };
  const logout = async () => {
    try { setBusy(true); await demoApi.merchantLogout(); clearPendingPhoto(); clearRotation(); setOrders([]); setAuthenticated(false); setLoginStatus(await demoApi.merchantStatus()); setError(""); }
    catch { setError("登出未完成，請重試。"); } finally { setBusy(false); }
  };
  const registerPasskey = async () => {
    try { setBusy(true); const result = await merchantPasskeyClient.passkey.addPasskey({ name: "茶行後台手機", authenticatorAttachment: "platform" }); if(result.error) throw new Error(); setLoginStatus(await demoApi.merchantStatus()); setError(""); }
    catch { setError("註冊未完成。若使用緊急密碼登入，請先登出並使用首次設定。"); } finally { setBusy(false); }
  };
  const passwordLogin = async () => {
    try {
      setBusy(true);
      await demoApi.merchantPasswordLogin(password);
      setPassword("");
      await refresh(); setAuthenticated(true); setError("");
    } catch (e) { setPassword(""); setError(e instanceof Error ? e.message : "登入失敗，請稍後重試。"); }
    finally { setBusy(false); }
  };
  const login = async () => {
    if (!challenge) return;
    try {
      setBusy(true);
      await demoApi.merchantPhoneLogin({ phone, challengeId: challenge.challengeId, code });
      await refresh();
      setAuthenticated(true); setPhone(""); setCode(""); setChallenge(undefined); setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "商家登入失敗");
    } finally { setBusy(false); }
  };
  const act = async (orderId: string, action: string, detail: Record<string, unknown> = {}) => {
    try {
      setBusy(true);
      clearRotation();
      await demoApi.adminAction(orderId, action, detail);
      await refresh();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失敗");
    } finally { setBusy(false); }
  };
  const auditAct = (orderId: string, action: string, label: string) => {
    setPendingAudit({ orderId, action, label });
    setAuditReason("");
  };
  const submitAuditAction = async () => {
    if (!pendingAudit) return;
    const reason = auditReason.trim();
    if (!reason || reason.length > 500) return;
    const action = pendingAudit;
    setPendingAudit(undefined);
    setAuditReason("");
    await act(action.orderId, action.action, { reason });
  };
  const selectPhoto = (orderId: string, file?: File) => {
    if (!file) return;
    setError("");
    setPendingPhoto(current => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return { orderId, file, previewUrl: URL.createObjectURL(file) };
    });
  };
  const confirmPhoto = async () => {
    if (!pendingPhoto) return;
    try {
      setBusy(true);
      clearRotation();
      await demoApi.packingPhoto(pendingPhoto.orderId, pendingPhoto.file);
      clearPendingPhoto();
      await refresh();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "照片上傳失敗，請重試。");
    } finally { setBusy(false); }
  };
  const rotate = async (orderId: string) => {
    try {
      setBusy(true);
      setCopyMessage("");
      const result = await demoApi.adminAction<DemoLookupSecretRotation>(orderId, "rotate-lookup-secret", { confirmed: true });
      setRotation({ orderId, accessSecret: result.accessSecret });
      setConfirmedOrderId(undefined);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "查詢憑證更新失敗");
    } finally { setBusy(false); }
  };
  const copyRotation = async () => {
    if (!rotation) return;
    try {
      await navigator.clipboard.writeText(rotation.accessSecret);
      setCopyMessage("已複製，請以人工方式交給已完成身分確認的顧客。" );
    } catch {
      setCopyMessage("無法自動複製；請從畫面手動抄下憑證。" );
    }
  };

  return <main className="py-8">
    <p className="prototype-notice">訂單 Demo：付款由人工確認。</p>
    <section className="demo-panel">
      <h1>商家訂單 Demo</h1>
      <Link className="filter-button mt-4 inline-flex" href="/">回到首頁</Link>
      <a className="filter-button mt-4 inline-flex" href="/private-app/">開啟離線帳務 App</a>
      {error && <div role="alert" className="product-draft-alert">{error}</div>}
      {pendingAudit && <section className="demo-panel mt-4" role="dialog" aria-modal="true" aria-labelledby="audit-reason-title">
        <h2 id="audit-reason-title">{pendingAudit.label}</h2>
        <label className="form-field mt-3">更正原因
          <textarea className="form-input" rows={3} maxLength={500} required aria-describedby="audit-reason-help" value={auditReason} onChange={event => setAuditReason(event.target.value)} />
        </label>
        <p id="audit-reason-help" className="muted mt-2">必填，最多 500 字。請簡述更正原因；原因、商家 Session 操作者與操作時間會保留在訂單紀錄。</p>
        <div className="form-actions mt-3">
          <button className="filter-button" type="button" disabled={busy} onClick={() => { setPendingAudit(undefined); setAuditReason(""); }}>取消更正</button>
          <button className="primary-action" type="button" disabled={busy || !auditReason.trim()} onClick={() => void submitAuditAction()}>確認更正</button>
        </div>
      </section>}
      {!authenticated ? <>
        {loginStatus?.passkey?.enabled ? <AdminPasskeyLogin registered={loginStatus.passkey.registered} onAuthenticated={resumePasskey} /> : loginStatus?.provider === "password" ? <>
          <h2 className="mt-6">Demo 密碼登入</h2>
          <p className="muted mt-3">請輸入授權驗收人員取得的 Demo 密碼。</p>
          {loginStatus.state !== "ready" && <p role="status">Demo 密碼登入尚未設定，請聯絡管理員。</p>}
          <form onSubmit={event => { event.preventDefault(); if (!busy && password && loginStatus.state === "ready") void passwordLogin(); }}>
            <label className="form-field mt-4">Demo 密碼
              <input className="form-input" type="password" autoComplete="current-password" maxLength={128} value={password} onChange={event => setPassword(event.target.value)} />
            </label>
            <button className="primary-action mt-4" type="submit" disabled={busy || !password || loginStatus.state !== "ready"}>{busy ? "登入中…" : "登入"}</button>
          </form>
        </> : <>
        <h2 className="mt-6">手機驗證登入</h2>
        {!loginStatus && <p role="status">正在讀取登入設定…</p>}
        {loginStatus?.state === "binding-pending" && <p role="status" className="prototype-notice mt-3">尚未完成陳老師本人確認與手機綁定。請聯絡授權管理員協助本人確認及綁定；請勿提供驗證碼給管理員。</p>}
        {loginStatus?.state === "sms-pending" && <p role="status" className="prototype-notice mt-3">手機已完成本人確認；簡訊服務尚未啟用。</p>}
        {loginStatus?.simulated && <p className="prototype-notice mt-3">模擬簡訊：不會發送真實簡訊，驗證碼由受保護的操作員收件匣交付。</p>}
        <label className="form-field mt-6">已綁定手機
          <input className="form-input" type="tel" inputMode="tel" autoComplete="tel" maxLength={10} value={phone}
            onChange={e => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setChallenge(undefined); setCode(""); setError(""); }} />
        </label>
        <button className="primary-action mt-4" disabled={busy || loginStatus?.state !== "ready" || !/^09\d{8}$/.test(phone) || resendSeconds > 0} onClick={() => void sendCode()}>
          {challenge ? resendSeconds > 0 ? `重新傳送（${resendSeconds} 秒）` : "重新傳送驗證碼" : "傳送驗證碼"}
        </button>
        {challenge && <>
          <p role="status" className="muted mt-3">驗證碼五分鐘內有效，只能使用一次。</p>
          <label className="form-field mt-4">六位數驗證碼
            <input className="form-input" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} />
          </label>
          <button className="primary-action mt-4" disabled={busy || !/^\d{6}$/.test(code)} onClick={() => void login()}>驗證並登入</button>
        </>}
        </>}
      </> : <>
        <div className="form-actions mt-6"><button className="filter-button" onClick={() => void refresh()}>重新載入</button><button className="filter-button" disabled={busy} onClick={() => void logout()}>登出</button>{loginStatus?.passkey?.enabled && <button className="filter-button" disabled={busy} onClick={() => void registerPasskey()}>新增這支手機的 Passkey</button>}</div>
        <div className="demo-order-list">
          {orders.length === 0 && <p>目前沒有示範訂單。</p>}
          {orders.map(({ order, notifications }) => <article className="demo-order-card" key={order.orderId}>
            <h2>{statusLabel[order.status]}</h2><p>訂單編號：{order.orderNumber ?? order.orderId}</p>
            <DemoOrderProgress order={order} />
            <p>付款：{order.paymentStatus === "manual-confirmed" ? "已人工確認" : "待人工確認"}</p>
            {order.paymentStatus === "pending-manual-verification" && <button className="filter-button" disabled={busy} onClick={() => auditAct(order.orderId, "confirm-payment", "人工確認付款")}>人工確認付款</button>}
            {order.paymentStatus === "manual-confirmed" && order.status !== "shipped" && order.status !== "delivered" && <button className="filter-button" disabled={busy} onClick={() => auditAct(order.orderId, "revoke-payment", "撤銷付款確認")}>撤銷付款確認</button>}
            {order.status === "confirmed" && <section className="mt-4" aria-labelledby={`packing-photo-${order.orderId}`}>
              <h3 id={`packing-photo-${order.orderId}`}>包裝照片</h3>
              <p className="muted">請先選擇拍照或相簿照片，檢查預覽後再按「確認包裝」。</p>
              <div className="form-actions mt-3">
                <label className="filter-button" htmlFor={`packing-camera-${order.orderId}`}>開啟相機
                  <input id={`packing-camera-${order.orderId}`} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onClick={e => { e.currentTarget.value = ""; }} onChange={e => selectPhoto(order.orderId, e.target.files?.[0])} />
                </label>
                <label className="filter-button" htmlFor={`packing-gallery-${order.orderId}`}>選擇相簿
                  <input id={`packing-gallery-${order.orderId}`} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onClick={e => { e.currentTarget.value = ""; }} onChange={e => selectPhoto(order.orderId, e.target.files?.[0])} />
                </label>
              </div>
              {pendingPhoto?.orderId === order.orderId && <div className="mt-4" role="group" aria-label="包裝照片預覽">
                <img className="product-draft-photo-preview" src={pendingPhoto.previewUrl} alt="包裝照片預覽" />
                <p className="muted mt-2">{pendingPhoto.file.name}</p>
                <div className="form-actions mt-3">
                  <button className="primary-action" type="button" disabled={busy} onClick={() => void confirmPhoto()}>確認包裝</button>
                  <button className="filter-button" type="button" disabled={busy} onClick={clearPendingPhoto}>取消</button>
                  <label className="text-button" htmlFor={`packing-gallery-${order.orderId}`}>重選照片</label>
                </div>
              </div>}
            </section>}
            {order.status === "packed" && <div className="form-actions mt-4"><button className="primary-action" disabled={busy || order.paymentStatus !== "manual-confirmed"} onClick={() => void act(order.orderId, "ship")}>人工確認出貨</button><button className="filter-button" disabled={busy} onClick={() => auditAct(order.orderId, "reopen-packing", "重新開啟包裝")}>重新開啟包裝</button></div>}
            {(order.status === "shipped" || order.status === "delivered") && <section className="mt-4"><h3>出貨更正流程</h3><p className="muted">出貨狀態不會直接倒退；填寫原因後，顧客查單會看到異常紀錄。這不代表物流已撤回。</p><div className="form-actions"><button className="filter-button" disabled={busy} onClick={() => auditAct(order.orderId, "shipping-exception", "出貨異常")}>記錄出貨異常</button><button className="filter-button" disabled={busy} onClick={() => auditAct(order.orderId, "intercept-requested", "攔件申請")}>記錄攔件申請</button><button className="filter-button" disabled={busy} onClick={() => auditAct(order.orderId, "shipping-correction", "出貨紀錄更正")}>更正出貨紀錄</button></div></section>}
            {order.status === "shipped" && <button className="primary-action mt-4" disabled={busy} onClick={() => void act(order.orderId, "deliver")}>模擬送達</button>}
            <section className="mt-6" aria-labelledby={`recovery-${order.orderId}`}>
              <h3 id={`recovery-${order.orderId}`}>遺失查詢憑證</h3>
              <p className="muted">Demo 專用。請先透過店外方式確認顧客身分；此操作會立即使舊憑證失效。</p>
              <label className="form-field mt-3">
                <input type="checkbox" checked={confirmedOrderId === order.orderId} onChange={e => { setConfirmedOrderId(e.target.checked ? order.orderId : undefined); setRotation(undefined); setCopyMessage(""); }} />
                我已透過店外方式確認這位顧客的身分
              </label>
              <button className="filter-button mt-3" disabled={busy || confirmedOrderId !== order.orderId} onClick={() => void rotate(order.orderId)}>更新查詢憑證</button>
              {rotation?.orderId === order.orderId && <div role="status" className="prototype-notice mt-3">
                <p>新憑證只顯示一次，請手動交給已確認身分的顧客；離開此頁、重新整理或進行其他操作後會清除。</p>
                <label className="form-field mt-3">補發查單密語（只限已核對身分的店家查看）
                  <textarea className="form-input" readOnly rows={3} spellCheck={false} autoComplete="off"
                    value={rotation.accessSecret} onFocus={e => e.currentTarget.select()} onClick={e => e.currentTarget.select()} />
                </label>
                <p className="muted">若瀏覽器無法自動複製，可長按上方欄位選取全部，再複製；請勿拍照或傳到公開訊息。</p>
                <button className="text-button" type="button" onClick={() => void copyRotation()}>複製新憑證</button>
                {copyMessage && <p role="status">{copyMessage}</p>}
              </div>}
            </section>
            <h3 className="mt-6">通知紀錄</h3><ul>{notifications.map(note => <li key={note.id}>{note.audience}：{note.path}：{note.state}
              {note.state === "queued" && <><button className="text-button" onClick={() => void act(order.orderId, "simulate-notification", { notificationId: note.id, outcome: "success" })}>模擬成功</button><button className="text-button" onClick={() => void act(order.orderId, "simulate-notification", { notificationId: note.id, outcome: "failure" })}>模擬失敗</button></>}
              {note.state === "failed" && <button className="text-button" onClick={() => void act(order.orderId, "retry-notification", { notificationId: note.id })}>重試</button>}
            </li>)}</ul>
          </article>)}
        </div>
      </>}
    </section>
  </main>;
}
