import { useContext } from "react";
import { StoreContext } from "./context";
import { StoreApi } from "../../core/createStore";

export function useStore<T, U>(selector: (state: T) => U): U {
  const store = useContext(StoreContext) as StoreApi<T> | null;
  if (!store) {
    throw new Error("Store not found. Wrap your app with StoreProvider.");
  }
  const state = store.getState();
  return selector(state);
} 