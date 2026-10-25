import { useCallback } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import type { ComponentProps } from "react";
export default function Link({
  href,
  ...props
}: Omit<ComponentProps<typeof RouterLink>, "to"> & { href: string }) {
  return <RouterLink to={href} {...props} />;
}
export function usePathname() {
  return useLocation().pathname;
}
export function useSearchParams() {
  return new URLSearchParams(useLocation().search);
}
export function refreshView() {
  window.dispatchEvent(new Event("jcts:refresh"));
}
export function useRouter() {
  const navigate = useNavigate();
  return {
    push: useCallback((path: string) => navigate(path), [navigate]),
    replace: useCallback(
      (path: string) => navigate(path, { replace: true }),
      [navigate],
    ),
    refresh: refreshView,
  };
}
export function notFound(): never {
  throw new Error("Page not found");
}
