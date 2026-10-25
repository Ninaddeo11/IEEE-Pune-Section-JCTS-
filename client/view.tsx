import { createContext, useContext } from "react";
import type { ViewData } from "./types";
export const ViewContext = createContext<ViewData | null>(null);
export function useView() {
  const value = useContext(ViewContext);
  if (!value) throw new Error("Page data is not available");
  return value;
}
