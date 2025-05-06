/** @jsxImportSource react */
import { createContext } from "react";
import { StoreApi } from "../../core/createStore";

export const StoreContext = createContext<StoreApi<unknown> | null>(null);
