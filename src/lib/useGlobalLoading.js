import { useState, useEffect } from "react";
import { apiState } from "./api";

export function useGlobalLoading() {
  const [loading, setLoading] = useState(apiState.activeRequests > 0);
  useEffect(() => apiState.subscribe(setLoading), []);
  return loading;
}
