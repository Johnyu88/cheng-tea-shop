"use client";

import { createContext, useContext, useState, type ReactNode, type ReactElement } from "react";
import type { CartService, CatalogService, CheckoutService, PublishingService } from "@/lib/domain";
import { createDemoCommerceServices, createInMemoryCommerceServices, createMockCartService } from "@/lib/domain";
import { publicTeaCatalogService } from "@/lib/domain/in-memory-adapters";

export type CommerceContextValue = {
  catalogService: CatalogService;
  cartService: CartService;
  checkoutService: CheckoutService;
  publishingService: PublishingService;
};

type CommerceProviderProps = {
  children: ReactNode;
  services?: Partial<CommerceContextValue>;
  publicStorefront?: boolean;
};

const CommerceContext = createContext<CommerceContextValue | null>(null);

const createDefaultServices = (): CommerceContextValue => {
  if (process.env.NEXT_PUBLIC_PUBLIC_STOREFRONT === "enabled") return createInMemoryCommerceServices({ catalogService: publicTeaCatalogService, cartService: createMockCartService({ catalog: publicTeaCatalogService, storageKey: "chen-tea-public-cart-v1" }) });
  return process.env.NEXT_PUBLIC_DEMO_COMMERCE === "enabled" ? createDemoCommerceServices() : createInMemoryCommerceServices();
};

export function CommerceProvider({ children, services, publicStorefront = false }: CommerceProviderProps): ReactElement {
  const [contextValue] = useState<CommerceContextValue>(() => ({ ...(publicStorefront ? createInMemoryCommerceServices({ catalogService: publicTeaCatalogService }) : createDefaultServices()), ...services }));

  return <CommerceContext.Provider value={contextValue}>{children}</CommerceContext.Provider>;
}

export function useCommerce(): CommerceContextValue {
  const contextValue = useContext(CommerceContext);

  if (contextValue === null) {
    throw new Error("useCommerce must be used within a CommerceProvider");
  }

  return contextValue;
}
