"use client";

import { useEffect, useState, type JSX } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product, ProductVariant } from "@/lib/domain";
import { useCommerce } from "@/features/commerce/components/commerce-provider";
import { TeaFacts } from "./tea-facts";

type ProductDetailPageProps = {
  slug: string;
};

type CatalogState =
  | { status: "loading" }
  | { status: "ready"; product: Product }
  | { status: "not-found"; message: string }
  | { status: "error"; message: string };

type AddState =
  | { status: "idle" }
  | { status: "adding" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const formatPrice = (variant: ProductVariant) => `${variant.price.currency === "TWD" ? "NT$" : variant.price.currency}${variant.price.amount.toLocaleString("zh-TW")}`;

export function ProductDetailPage({ slug }: ProductDetailPageProps): JSX.Element {
  const { catalogService, cartService } = useCommerce();
  const router = useRouter();
  const [catalogState, setCatalogState] = useState<CatalogState>({ status: "loading" });
  const [quantity, setQuantity] = useState("1");
  const [addState, setAddState] = useState<AddState>({ status: "idle" });
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      setCatalogState({ status: "loading" });
      const result = await catalogService.getProductBySlug(slug);
      if (!active) return;

      if (!result.ok) {
        setCatalogState(
          result.error.code === "product-not-found"
            ? { status: "not-found", message: result.error.message }
            : { status: "error", message: result.error.message },
        );
        return;
      }

      setCatalogState({ status: "ready", product: result.value });
    };

    void Promise.resolve().then(loadProduct);
    return () => {
      active = false;
    };
  }, [catalogService, slug, requestKey]);

  const product = catalogState.status === "ready" ? catalogState.product : undefined;
  const variant = product && Array.isArray(product.variants) ? product.variants[0] : undefined;
  const numericQuantity = Number(quantity);
  const quantityIsValid = Number.isInteger(numericQuantity) && numericQuantity >= 1 && variant !== undefined && numericQuantity <= variant.maxQuantity;

  const changeQuantity = (next: number) => {
    setQuantity(String(next));
    setAddState({ status: "idle" });
  };

  const addToCart = async () => {
    if (variant === undefined || variant.inventoryStatus === "sold-out" || !quantityIsValid || product === undefined) {
      const message =
        variant === undefined
          ? "目前沒有可購買的規格。"
          : numericQuantity > variant.maxQuantity
            ? `最多購買 ${variant.maxQuantity} 件。`
            : "請輸入至少 1 件。";
      setAddState({ status: "error", message });
      return;
    }

    setAddState({ status: "adding" });
    const result = await cartService.addItem(product.id, variant.id, numericQuantity);
    if (!result.ok) {
      setAddState({ status: "error", message: result.error.message });
      return;
    }

    router.push("/cart");
    setAddState({ status: "success", message: "已加入購物車" });
  };

  if (catalogState.status === "loading") {
    return <p role="status">正在整理茶品資料</p>;
  }

  if (catalogState.status === "not-found") {
    return (
      <main>
        <div role="alert">
          <p>{catalogState.message}</p>
          <Link href="/#catalog">返回茶品目錄</Link>
        </div>
      </main>
    );
  }

  if (catalogState.status === "error") {
    return (
      <main>
        <div role="alert">
          <p>{catalogState.message}</p>
          <button type="button" onClick={() => setRequestKey((key) => key + 1)}>
            再試一次
          </button>
        </div>
      </main>
    );
  }

  const readyProduct = product;
  if (readyProduct === undefined || variant === undefined) {
    return (
      <main>
        <article>
          <h1>{readyProduct?.name ?? "茶品"}</h1>
          <p role="alert">目前沒有可購買的規格。</p>
        </article>
      </main>
    );
  }

  const soldOut = variant.inventoryStatus === "sold-out";

  return (
    <main>
      <nav aria-label="茶品頁導覽"><Link href="/#catalog">← 返回首頁／繼續選茶</Link></nav>
      <article aria-labelledby="product-detail-heading">
        <div role="img" aria-label={readyProduct.image.alt}>
          {readyProduct.image.src === null ? readyProduct.image.alt : <img src={readyProduct.image.src} alt={readyProduct.image.alt} />}
        </div>
        <h1 id="product-detail-heading">{readyProduct.name}</h1>
        {readyProduct.summary.trim() && <p>{readyProduct.summary}</p>}
        <TeaFacts product={readyProduct} />
        <p>{variant.specification}</p>
        <p>{formatPrice(variant)}</p>
        <p>{soldOut ? "目前售完" : `可購買，最多 ${variant.maxQuantity} 件`}</p>

        <div aria-label="購買數量">
          <button type="button" aria-label="減少數量" disabled={numericQuantity <= 1 || !Number.isInteger(numericQuantity)} onClick={() => changeQuantity(Math.max(1, numericQuantity - 1))}>
            −
          </button>
          <input
            aria-label="購買數量"
            type="number"
            min={1}
            max={variant.maxQuantity}
            step={1}
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value);
              setAddState({ status: "idle" });
            }}
          />
          <button type="button" aria-label="增加數量" disabled={numericQuantity >= variant.maxQuantity || !Number.isInteger(numericQuantity)} onClick={() => changeQuantity(Math.min(variant.maxQuantity, numericQuantity + 1))}>
            ＋
          </button>
        </div>

        {addState.status === "success" && (
          <p role="status">
            {addState.message} <Link href="/cart">查看購物車</Link>
          </p>
        )}
        {addState.status === "error" && (
          <div role="alert">
            <p>{addState.message}</p>
            {variant.inventoryStatus !== "sold-out" && quantityIsValid && <button type="button" onClick={addToCart}>重試加入購物車</button>}
          </div>
        )}
        <button type="button" disabled={soldOut || addState.status === "adding"} onClick={addToCart}>
          加入購物車
        </button>
        <p><Link href="/#catalog">返回首頁／繼續選茶</Link></p>
      </article>
    </main>
  );
}
