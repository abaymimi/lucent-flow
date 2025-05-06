import React, { ReactNode } from "react";
import { StoreApi } from "./createStore";
import { StoreContext } from "./context";

interface LucentProviderProps<T extends object> {
  children: ReactNode;
  store: StoreApi<T>;
}

/**
 * LucentProvider component for wrapping your app with the Lucent store context.
 * This component should be used at the root of your app or around components
 * that need access to the store.
 */
export function LucentProvider<T extends object>({
  children,
  store,
}: LucentProviderProps<T>) {
  return (
    <StoreContext.Provider value={store as StoreApi<unknown>}>
      {children}
    </StoreContext.Provider>
  );
}
