"use client";

import { createContext, useContext, useState, type ReactNode, type ReactElement } from "react";
import type { CartService, CatalogService, CheckoutService, PublishingService } from "@/lib/domain";
import { createDemoCommerceServices, createInMemoryCommerceServices } from "@/lib/domain";

export type CommerceContextValue = {
  catalogService: CatalogService;
  cartService: CartService;
  checkoutService: CheckoutService;
  publishingService: PublishingService;
};

type CommerceProviderProps = {
  children: ReactNode;
  services?: Partial<CommerceContextValue>;
};

const CommerceContext = createContext<CommerceContextValue | null>(null);

const createDefaultServices = (): CommerceContextValue => {
  return process.env.NEXT_PUBLIC_DEMO_COMMERCE === "enabled" ? createDemoCommerceServices() : createInMemoryCommerceServices();
};

export function CommerceProvider({ children, services }: CommerceProviderProps): ReactElement {
  const [contextValue] = useState<CommerceContextValue>(() => ({ ...createDefaultServices(), ...services }));

  return <CommerceContext.Provider value={contextValue}>{children}</CommerceContext.Provider>;
}

export function useCommerce(): CommerceContextValue {
  const contextValue = useContext(CommerceContext);

  if (contextValue === null) {
    throw new Error("useCommerce must be used within a CommerceProvider");
  }

  return contextValue;
}
