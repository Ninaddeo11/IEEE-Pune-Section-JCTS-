export function safeUrl(value: unknown, fallback = "/") {
  const url = String(value ?? "");
  return /^\/(?!\/)/.test(url) || /^https:\/\//.test(url) ? url : fallback;
}
