# Wave 3 — Domain Interfaces and Mock Adapter Design

## Status

Approved in conversation on 2026-09-20. This specification defines the next bounded implementation slice after the Wave 2 brand shell. It does not authorize product pages, cart UI, checkout UI, payment integration, ERP integration, authentication, persistence, or real customer data.

## Goal

Create a project-owned domain boundary that lets future storefront components consume catalog, cart, checkout, and product-draft behavior through stable interfaces while the current implementation uses deterministic synthetic data only.

## Constraints and non-goals

- The website remains Website First → Mock API → ERP Reuse → API Integration.
- No UI component imports a fixture or Mock Adapter implementation directly.
- Money is represented as integer New Taiwan dollar amounts; no floating-point arithmetic is used for totals.
- The Mock Adapter must never contain real customer data, payment credentials, private addresses, or unsupported product claims.
- Product data is synthetic and may generate more than 40 records to prove progressive loading without creating a fixed 40-item ceiling.
- The first product-publishing contract supports one product with one specification and available / sold-out status; it does not implement image processing or AI generation.
- Payment, logistics, ERP, persistence, authentication, authorization, and backup/restore are outside this slice.

## Domain contracts

The implementation will place contracts in focused files under `lib/domain/`:

### Shared values and errors

```ts
type ProductId = string;
type ProductSlug = string;
type VariantId = string;

type Money = {
  currency: "TWD";
  amount: number; // integer, >= 0
};

type InventoryStatus = "available" | "sold-out";

type DomainErrorCode =
  | "catalog-unavailable"
  | "product-not-found"
  | "cart-empty"
  | "product-sold-out"
  | "purchase-limit-exceeded"
  | "invalid-draft";

type DomainError = {
  code: DomainErrorCode;
  message: string;
  retryable: boolean;
};
```

`Money.amount` must be validated at contract boundaries as a finite non-negative integer. A calculation failure must return a typed domain error rather than a NaN or fractional TWD value.

### Catalog and product draft

```ts
type TeaCategory = "white" | "green" | "oolong" | "black" | "dark" | "other";
type TasteTag = "light" | "sweet" | "rich" | "roasted";

type ProductImage = {
  src: string | null;
  alt: string;
  isPlaceholder: boolean;
};

type ProductVariant = {
  id: VariantId;
  specification: string;
  price: Money;
  inventoryStatus: InventoryStatus;
  maxQuantity: number;
};

type Product = {
  id: ProductId;
  slug: ProductSlug;
  name: string;
  category: TeaCategory;
  tasteTags: TasteTag[];
  summary: string;
  image: ProductImage;
  variants: ProductVariant[];
  publication: "draft" | "published";
};

type ProductDraft = {
  name: string;
  specification: string;
  price: Money;
  category: TeaCategory;
  inventoryStatus: InventoryStatus;
  tasteTags: TasteTag[];
  summary?: string;
};
```

The published catalog may contain multiple variants in the future, but the Mock Adapter's publishing operation creates exactly one variant from `ProductDraft`.

### Cart and checkout

```ts
type CartLine = {
  productId: ProductId;
  variantId: VariantId;
  productName: string;
  specification: string;
  unitPrice: Money;
  quantity: number;
  inventoryStatus: InventoryStatus;
  maxQuantity: number;
};

type Cart = {
  lines: CartLine[];
  subtotal: Money;
};

type CheckoutDraft = {
  phone: string;
  email?: string;
  deliveryMethod: "home-delivery" | "store-pickup";
  paymentMethod: "credit-card" | "line-pay" | "pay-at-store";
};
```

The contract does not store card numbers, payment tokens, or personal data in the Mock Adapter. Validation of the phone and delivery/payment combinations is exposed as a service result, not as UI-specific logic.

## Service interfaces

All services return `Promise` results so a future HTTP or ERP adapter can replace the Mock Adapter without changing consumers.

```ts
type Page<T> = {
  items: T[];
  nextCursor: string | null;
  total: number;
};

type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: DomainError };

type CatalogQuery = {
  category?: TeaCategory;
  taste?: TasteTag;
  cursor?: string;
  limit?: number;
};

interface CatalogService {
  listProducts(query?: CatalogQuery): Promise<ServiceResult<Page<Product>>>;
  getProductBySlug(slug: ProductSlug): Promise<ServiceResult<Product>>;
}

interface CartService {
  getCart(): Promise<ServiceResult<Cart>>;
  addItem(productId: ProductId, variantId: VariantId, quantity: number): Promise<ServiceResult<Cart>>;
  updateQuantity(productId: ProductId, variantId: VariantId, quantity: number): Promise<ServiceResult<Cart>>;
  removeItem(productId: ProductId, variantId: VariantId): Promise<ServiceResult<Cart>>;
}

interface CheckoutService {
  validate(draft: CheckoutDraft): Promise<ServiceResult<CheckoutDraft>>;
}

interface PublishingService {
  saveDraft(draft: ProductDraft): Promise<ServiceResult<ProductDraft>>;
  publishDraft(draft: ProductDraft): Promise<ServiceResult<Product>>;
}
```

The interfaces are exported from project-owned modules. Fixtures and Mock Adapter classes may implement them, but UI code imports only the interfaces and a composition entry point.

## Mock Adapter behavior

The Mock Adapter uses an explicit scenario option for deterministic tests:

```ts
type MockScenario = "happy" | "empty" | "catalog-error" | "sold-out" | "purchase-limit";
```

- `happy`: returns a deterministic catalog, supports catalog paging, cart add/update/remove, checkout validation, and draft save/publish.
- `empty`: returns an empty first catalog page with `nextCursor: null` and no error.
- `catalog-error`: returns `catalog-unavailable` without throwing.
- `sold-out`: exposes a sold-out variant and rejects adding it with `product-sold-out`.
- `purchase-limit`: rejects quantities above `maxQuantity` with `purchase-limit-exceeded` while retaining the existing cart.

The generated happy-path catalog contains at least 41 synthetic products, has stable IDs and slugs, and includes products across every `TeaCategory` and `TasteTag`. The first page size is configurable within the adapter but defaults to 12. Pagination is cursor-based and deterministic.

## Error and data-safety rules

- Service methods never throw for expected domain conditions; they return `ServiceResult` errors.
- Invalid quantities, negative money, fractional money, and invalid draft fields return `invalid-draft`.
- A failed cart operation does not discard the prior valid cart.
- Sold-out products remain readable but cannot be added to the cart.
- No payment credential, authentication token, private address, or real customer information is created or persisted.
- Synthetic product copy must not claim origin, health effects, organic status, or other evidence-gated facts.

## Testing and acceptance

Tests will prove:

1. Contract consumers can use the Mock Adapter through service interfaces.
2. Money totals remain integer TWD values.
3. Happy-path catalog paging returns at least 41 synthetic products without duplicates.
4. Empty and catalog-error scenarios return the specified result shapes.
5. Sold-out and purchase-limit operations return typed errors and preserve valid state.
6. Draft save/publish creates one specification and does not invent unsupported claims.
7. No existing homepage component imports fixtures or Mock Adapter internals.

The Wave 3 exit gate is `pnpm test:run`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`, plus a clean diff review for secrets and real customer data. UI integration belongs to Wave 4 and later.
