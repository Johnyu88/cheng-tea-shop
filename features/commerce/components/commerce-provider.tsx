"use client";

import { createContext, useContext, useState, type ReactNode, type ReactElement } from "react";
import type { CartService, CatalogService, CheckoutService, PublishingService } from "@/lib/domain";
import {
  createMockCartService,
  createMockCatalogService,
  createMockCheckoutService,
  createMockPublishingService,
} from "@/lib/domain";

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
  const catalogService = createMockCatalogService();

  return {
    catalogService,
    cartService: createMockCartService({ catalog: catalogService }),
    checkoutService: createMockCheckoutService(),
    publishingService: createMockPublishingService(),
  };
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
