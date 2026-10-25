import { AsyncLocalStorage } from "node:async_hooks";
export const requests = new AsyncLocalStorage<{
  request: Request;
  setCookies: string[];
}>();
export function requestContext() {
  const value = requests.getStore();
  if (!value) throw new Error("Server request context required");
  return value;
}
export function cookieValue(name: string) {
  const values = requestContext().request.headers.get("cookie") || "";
  return values
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
