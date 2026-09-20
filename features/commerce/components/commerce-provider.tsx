"use client";

import { createContext, useContext, useState, type ReactNode, type ReactElement } from "react";
import type { CartService, CatalogService } from "@/lib/domain";
import { createMockCartService, createMockCatalogService } from "@/lib/domain";

export type CommerceContextValue = {
  catalogService: CatalogService;
  cartService: CartService;
};

type CommerceProviderProps = {
  children: ReactNode;
  services?: CommerceContextValue;
};

const CommerceContext = createContext<CommerceContextValue | null>(null);

const createDefaultServices = (): CommerceContextValue => {
  const catalogService = createMockCatalogService();

  return {
    catalogService,
    cartService: createMockCartService({ catalog: catalogService }),
  };
};

export function CommerceProvider({ children, services }: CommerceProviderProps): ReactElement {
  const [contextValue] = useState<CommerceContextValue>(() => services ?? createDefaultServices());

  return <CommerceContext.Provider value={contextValue}>{children}</CommerceContext.Provider>;
}

export function useCommerce(): CommerceContextValue {
  const contextValue = useContext(CommerceContext);

  if (contextValue === null) {
    throw new Error("useCommerce must be used within a CommerceProvider");
  }

  return contextValue;
}
