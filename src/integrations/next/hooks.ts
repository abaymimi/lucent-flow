import { useContext } from "react";
import { StoreApi } from "zustand";
import { StoreContext } from "./context";

export function useStore<T, U>(selector: (state: T) => U): U {
  const store = useContext(StoreContext) as StoreApi<T> | null;
  if (!store) {
    throw new Error("Store not found. Wrap your app with StoreProvider.");
  }
  const state = store.getState();
  return selector(state);
} 