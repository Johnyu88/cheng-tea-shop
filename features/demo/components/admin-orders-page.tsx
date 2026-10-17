"use client";

import Link from "next/link";
import { useState } from "react";
import { demoApi, type DemoAdminOrder, type DemoLookupSecretRotation } from "../demo-api";
import { DemoOrderProgress } from "./demo-order-progress";

const statusLabel = { confirmed: "已確認", packed: "已打包", shipped: "已出貨", delivered: "已送達" } as const;

export function AdminOrdersPage() {
  const [credential, setCredential] = useState("");
  const [showCredential, setShowCredential] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState<DemoAdminOrder[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>();
  const [rotation, setRotation] = useState<{ orderId: string; accessSecret: string }>();
  const [copyMessage, setCopyMessage] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState<{ orderId: string; file: File; previewUrl: string }>();
  const normalizedCredential = credential.trim();
  const credentialValid = /^[0-9a-fA-F]{64}$/.test(normalizedCredential);
  const invalidCharacters = [...normalizedCredential].filter(char => !/[0-9a-fA-F]/.test(char)).length;

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
  const login = async () => {
    try {
      setBusy(true);
      await demoApi.merchantLogin(normalizedCredential);
      setAuthenticated(true);
      setCredential("");
      await refresh();
      setError("");
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
    <p className="prototype-notice">Demo 專用：不會寄送真實通知，也不會連接付款或外部服務。</p>
    <section className="demo-panel">
      <h1>商家訂單 Demo</h1>
      <Link className="filter-button mt-4 inline-flex" href="/">回到首頁</Link>
      {error && <div role="alert" className="product-draft-alert">{error}</div>}
      {!authenticated ? <>
        <label className="form-field mt-6">商家 Demo 憑證
          <input className="form-input" type={showCredential ? "text" : "password"} autoComplete="off" spellCheck={false} value={credential}
            onChange={e => { setCredential(e.target.value); setError(""); }} autoCapitalize="off" autoCorrect="off" />
        </label>
        <p role="status" className="muted mt-3">憑證長度：{normalizedCredential.length}/64 {credential.length !== normalizedCredential.length ? "已忽略前後空白" : ""}{credentialValid ? "格式正確" : invalidCharacters ? `有 ${invalidCharacters} 個非十六進位字元` : "請輸入 64 個十六進位字元"}</p>
        <button type="button" className="filter-button mt-3" onClick={() => { setCredential(""); setShowCredential(false); setError(""); }}>清除憑證</button>
        <button className="filter-button mt-3" type="button" aria-pressed={showCredential} onClick={() => setShowCredential(value => !value)}>{showCredential ? "隱藏憑證" : "顯示憑證"}</button>
        <button className="primary-action mt-6" disabled={busy || !credentialValid} onClick={() => void login()}>登入商家 Demo</button>
      </> : <>
        <button className="filter-button mt-6" onClick={() => void refresh()}>重新載入</button>
        <div className="demo-order-list">
          {orders.length === 0 && <p>目前沒有示範訂單。</p>}
          {orders.map(({ order, notifications }) => <article className="demo-order-card" key={order.orderId}>
            <h2>{statusLabel[order.status]}</h2><p>{order.orderId}</p>
            <DemoOrderProgress order={order} />
            <p>付款：{order.paymentStatus === "manual-confirmed" ? "已人工確認" : "待人工確認"}</p>
            {order.paymentStatus === "pending-manual-verification" && <button className="filter-button" disabled={busy} onClick={() => void act(order.orderId, "confirm-payment")}>人工確認付款</button>}
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
            {order.status === "packed" && <button className="primary-action mt-4" disabled={busy || order.paymentStatus !== "manual-confirmed"} onClick={() => void act(order.orderId, "ship")}>人工確認出貨</button>}
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
