/** @jsxImportSource react */
import { createContext } from "react";
import { StoreApi } from "zustand";

export const StoreContext = createContext<StoreApi<unknown> | null>(null);
