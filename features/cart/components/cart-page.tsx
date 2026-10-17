"use client";

import { useCallback, useEffect, useState, type JSX } from "react";
import Link from "next/link";
import type { Cart, CartLine } from "@/lib/domain";
import { useCommerce } from "@/features/commerce/components/commerce-provider";

type CartState =
  | { status: "loading" }
  | { status: "ready"; cart: Cart }
  | { status: "error"; message: string };

type MutationState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; retryable: boolean };

type PendingOperation =
  | { kind: "update"; line: CartLine; quantity: number }
  | { kind: "remove"; line: CartLine };

const formatMoney = (amount: number) => `NT$${amount.toLocaleString("zh-TW")}`;
const isValidQuantity = (value: number, maxQuantity: number) => Number.isInteger(value) && value >= 1 && value <= maxQuantity;

export function CartPage(): JSX.Element {
  const { cartService } = useCommerce();
  const [cartState, setCartState] = useState<CartState>({ status: "loading" });
  const [mutationState, setMutationState] = useState<MutationState>({ status: "idle" });
  const [pendingOperation, setPendingOperation] = useState<PendingOperation>();
  const [requestKey, setRequestKey] = useState(0);

  const loadCart = useCallback(async () => {
    setCartState({ status: "loading" });
    const result = await cartService.getCart();
    if (!result.ok) {
      setCartState({ status: "error", message: result.error.message });
      return;
    }
    setCartState({ status: "ready", cart: result.value });
  }, [cartService]);

  useEffect(() => {
    void Promise.resolve().then(loadCart);
  }, [loadCart, requestKey]);

  const runOperation = async (operation: PendingOperation) => {
    setPendingOperation(operation);
    setMutationState({ status: "pending" });
    const result = operation.kind === "update"
      ? await cartService.updateQuantity(operation.line.productId, operation.line.variantId, operation.quantity)
      : await cartService.removeItem(operation.line.productId, operation.line.variantId);

    if (!result.ok) {
      setMutationState({ status: "error", message: result.error.message, retryable: result.error.retryable });
      return;
    }

    setCartState({ status: "ready", cart: result.value });
    setPendingOperation(undefined);
    setMutationState({ status: "success", message: operation.kind === "remove" ? "已移除茶品" : "購物車數量已更新" });
  };

  const updateLine = (line: CartLine, quantity: number) => {
    if (!isValidQuantity(quantity, line.maxQuantity)) {
      setMutationState({ status: "error", message: `請輸入 1 到 ${line.maxQuantity} 件。`, retryable: false });
      return;
    }
    void runOperation({ kind: "update", line, quantity });
  };

  if (cartState.status === "loading") return <p role="status">正在整理購物車</p>;

  if (cartState.status === "error") {
    return <main><div role="alert"><p>{cartState.message}</p><button type="button" onClick={() => setRequestKey((key) => key + 1)}>再試一次</button></div></main>;
  }

  const cart = cartState.cart;
  if (cart.lines.length === 0) {
    return <main>{mutationState.status === "success" && <p role="status">{mutationState.message}</p>}<section aria-labelledby="empty-cart-heading"><h1 id="empty-cart-heading">購物車是空的</h1><p>先挑一款喜歡的茶，再回來這裡查看。</p><Link href="/#catalog">開始選茶</Link><Link href="/">回首頁</Link></section></main>;
  }

  return (
    <main>
      <section aria-labelledby="cart-heading">
        <h1 id="cart-heading">購物車</h1>
        {mutationState.status === "success" && <p role="status">{mutationState.message}</p>}
        {mutationState.status === "error" && <div role="alert"><p>{mutationState.message}</p>{mutationState.retryable && pendingOperation !== undefined && <button type="button" onClick={() => void runOperation(pendingOperation)}>再試一次</button>}</div>}
        <div>
          {cart.lines.map((line) => {
            const disabled = mutationState.status === "pending";
            const soldOut = line.inventoryStatus === "sold-out";
            return <article key={`${line.productId}-${line.variantId}`} aria-label={`${line.productName}購物車品項`}>
              <h2>{line.productName}</h2>
              <p>{line.specification}</p>
              <p aria-label={`${line.productName}單價 ${formatMoney(line.unitPrice.amount)}`}>單價：{formatMoney(line.unitPrice.amount)}</p>
              <p>{soldOut ? "目前售完" : `目前有貨，最多購買 ${line.maxQuantity} 件`}</p>
              <div aria-label={`${line.productName}數量`}>
                <button type="button" aria-label={`減少 ${line.productName}`} disabled={disabled || line.quantity <= 1} onClick={() => updateLine(line, line.quantity - 1)}>−</button>
                <input aria-label={`${line.productName}數量`} type="number" min={1} max={line.maxQuantity} step={1} value={line.quantity} disabled={disabled} onChange={(event) => { const quantity = Number(event.target.value); if (event.target.value === "" || !isValidQuantity(quantity, line.maxQuantity)) { setMutationState({ status: "error", message: `請輸入 1 到 ${line.maxQuantity} 件。`, retryable: false }); return; } updateLine(line, quantity); }} />
                <button type="button" aria-label={`增加 ${line.productName}`} disabled={disabled || line.quantity >= line.maxQuantity} onClick={() => updateLine(line, line.quantity + 1)}>＋</button>
              </div>
              <p aria-label={`${line.productName}單項小計 ${formatMoney(line.unitPrice.amount * line.quantity)}`}>小計：{formatMoney(line.unitPrice.amount * line.quantity)}</p>
              <button type="button" disabled={disabled} aria-label={`移除 ${line.productName}`} onClick={() => void runOperation({ kind: "remove", line })}>移除</button>
            </article>;
          })}
        </div>
        <div aria-label="購物車摘要" role="region">
          <p aria-label={`購物車總小計 ${formatMoney(cart.subtotal.amount)}`}>小計：{formatMoney(cart.subtotal.amount)}</p>
        </div>
        <Link href="/#catalog">繼續購買</Link>
        <button type="button" onClick={() => window.history.back()}>返回上一頁</button>
        <Link href="/checkout">前往結帳</Link>
      </section>
    </main>
  );
}
