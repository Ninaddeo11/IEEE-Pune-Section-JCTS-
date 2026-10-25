// Convert a wall-clock value in an IANA timezone without relying on the host timezone.
export function zonedInstant(
  date: string,
  time = "00:00",
  timezone = "Asia/Kolkata",
) {
  if (!date) return null;
  const wall = `${date}T${time || "00:00"}:00`;
  const target = Date.parse(`${wall}Z`);
  if (!Number.isFinite(target)) throw new Error("Invalid event date/time");
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  let value = target;
  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(value)).map((p) => [p.type, p.value]),
    );
    const rendered = Date.parse(
      `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`,
    );
    if (rendered === target) return new Date(value);
    value += target - rendered;
  }
  throw new Error("This local time does not exist in the selected timezone");
}
// Ambiguous fall-back times resolve deterministically; invalid spring-forward times are rejected.
export function localInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function upcoming(
  item: { date: string; data: Record<string, unknown>; status: string },
  now = new Date(),
) {
  if (!item.date || ["COMPLETED", "ARCHIVED"].includes(item.status))
    return false;
  const zone = String(item.data.timezone || "Asia/Kolkata");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return item.date >= today;
}
