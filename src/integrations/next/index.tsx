/** @jsxImportSource react */
import { useRef, useEffect, Suspense } from "react";
import type { ReactNode } from "react";
import { StoreContext } from "./context";
import { NextConfig } from "./store";
import { StoreApi } from "../../core/createStore";

// Create a provider component
export function StoreProvider<T extends object>({
  children,
  createStore,
  config = {},
}: {
  children: ReactNode;
  createStore: () => StoreApi<T>;
  config?: NextConfig;
}) {
  const storeRef = useRef<StoreApi<T> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createStore();
  }

  // Handle hydration
  useEffect(() => {
    if (config.persist) {
      const storedState = localStorage.getItem(config.storageKey || "store");
      if (storedState) {
        storeRef.current?.setState(JSON.parse(storedState));
      }
    }
  }, [config.persist, config.storageKey]);

  // Handle persistence
  useEffect(() => {
    if (config.persist) {
      const unsubscribe = storeRef.current?.subscribe(() => {
        localStorage.setItem(
          config.storageKey || "store",
          JSON.stringify(storeRef.current?.getState())
        );
      });
      return () => unsubscribe?.();
    }
  }, [config.persist, config.storageKey]);

  const content = config.suspense ? (
    <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
  ) : (
    children
  );

  return (
    <StoreContext.Provider value={storeRef.current as StoreApi<unknown>}>
      {content}
    </StoreContext.Provider>
  );
}
