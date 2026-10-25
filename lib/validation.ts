import { z } from "zod";
import { zonedInstant } from "./dates";
import { collections, roles, statuses } from "./content";
type RichNode = {
  type: string;
  text?: string;
  content?: RichNode[];
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};
const richNode: z.ZodType<RichNode> = z.lazy(() =>
  z.object({
    type: z.string().max(40),
    text: z.string().max(100000).optional(),
    content: z.array(richNode).max(5000).optional(),
    attrs: z.record(z.string(), z.unknown()).optional(),
    marks: z
      .array(
        z.object({
          type: z.string().max(40),
          attrs: z.record(z.string(), z.unknown()).optional(),
        }),
      )
      .max(20)
      .optional(),
  }),
);
const url = z
  .string()
  .max(2000)
  .refine(
    (v) => !v || /^https:\/\//.test(v) || /^\/(?!\/)/.test(v),
    "Use an HTTPS URL or a local path",
  );
const calendarDate = z.string().refine((value) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}, "Enter a valid calendar date");
export const contentSchema = z
  .object({
    collection: z.enum(collections),
    title: z.string().trim().min(2).max(300),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(200),
    summary: z.string().max(2000),
    body: z.string().max(100000),
    category: z.string().max(100),
    date: calendarDate,
    endDate: calendarDate,
    image: url,
    imageAlt: z.string().max(500),
    featured: z.boolean(),
    homepage: z.boolean(),
    status: z.enum(statuses),
    publishAt: z.string().max(40),
    seoTitle: z.string().max(150),
    seoDescription: z.string().max(500),
    data: z.record(z.string(), z.unknown()),
  })
  .superRefine((v, ctx) => {
    if (
      v.publishAt &&
      (!/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:\d{2})$/.test(v.publishAt) ||
        !Number.isFinite(Date.parse(v.publishAt)))
    )
      ctx.addIssue({
        code: "custom",
        path: ["publishAt"],
        message: "Publication time requires an explicit timezone",
      });
    if (v.collection === "activities") {
      if (
        v.data.people !== undefined &&
        !z
          .array(
            z.object({
              personId: z.string().min(1),
              role: z.enum([
                "Speaker",
                "Organizer",
                "Coordinator",
                "Partner",
                "Host",
              ]),
            }),
          )
          .max(100)
          .safeParse(v.data.people).success
      )
        ctx.addIssue({
          code: "custom",
          message: "Select valid people and roles",
        });
      for (const field of [
        "speakers",
        "organizers",
        "coordinators",
        "partners",
        "hosts",
        "schedule",
        "highlights",
        "outcomes",
        "tags",
        "sdgs",
      ])
        if (
          v.data[field] !== undefined &&
          !z
            .array(
              z.union([
                z.string().max(2000),
                z.record(z.string(), z.string().max(2000)),
              ]),
            )
            .max(200)
            .safeParse(v.data[field]).success
        )
          ctx.addIssue({
            code: "custom",
            message: `${field} must contain bounded text entries`,
          });

      try {
        for (const field of ["startTime", "endTime"])
          if (
            v.data[field] &&
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v.data[field]))
          )
            throw new Error("Use HH:mm event times");
        new Intl.DateTimeFormat("en", {
          timeZone: String(v.data.timezone || "Asia/Kolkata"),
        });
        if (v.date)
          zonedInstant(
            v.date,
            String(v.data.startTime || "00:00"),
            String(v.data.timezone || "Asia/Kolkata"),
          );
        if (
          v.data.capacity &&
          (!Number.isInteger(Number(v.data.capacity)) ||
            Number(v.data.capacity) < 0)
        )
          throw new Error("Capacity must be a nonnegative integer");
        if (
          v.data.format &&
          !["Online", "Offline", "Hybrid"].includes(String(v.data.format))
        )
          throw new Error("Choose Online, Offline or Hybrid");
        if (
          v.data.registrationStatus &&
          !["Open", "Closed", "Coming soon", "Full", "Not required"].includes(
            String(v.data.registrationStatus),
          )
        )
          throw new Error("Choose a valid registration status");
      } catch (e) {
        ctx.addIssue({
          code: "custom",
          path: ["data"],
          message: e instanceof Error ? e.message : "Invalid event logistics",
        });
      }
    }
    if (v.collection === "homepage") {
      if (v.data.order !== undefined && !Number.isFinite(Number(v.data.order)))
        ctx.addIssue({
          code: "custom",
          message: "Section order must be numeric",
        });
      if (
        v.data.itemCount !== undefined &&
        (!Number.isInteger(Number(v.data.itemCount)) ||
          Number(v.data.itemCount) < 1 ||
          Number(v.data.itemCount) > 24)
      )
        ctx.addIssue({ code: "custom", message: "Item count must be 1?24" });
    }

    if (
      v.data.richText !== undefined &&
      !richNode.safeParse(v.data.richText).success
    )
      ctx.addIssue({
        code: "custom",
        path: ["data", "richText"],
        message: "Rich-text document has invalid structure",
      });
    if (
      v.data.cards !== undefined &&
      !z
        .array(
          z.object({
            title: z.string().max(200),
            description: z.string().max(1000),
          }),
        )
        .max(100)
        .safeParse(v.data.cards).success
    )
      ctx.addIssue({
        code: "custom",
        path: ["data", "cards"],
        message: "Cards require text titles and descriptions",
      });
    if (v.date && v.endDate && v.endDate < v.date)
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be on or after the start date",
      });
    if (JSON.stringify(v.data).length > 200000)
      ctx.addIssue({
        code: "custom",
        path: ["data"],
        message: "Structured content exceeds 200 KB",
      });
    for (const [key, value] of Object.entries(v.data)) {
      if (
        /(url|link|pdf|thumbnail)$/i.test(key) &&
        typeof value === "string" &&
        !url.safeParse(value).success
      )
        ctx.addIssue({
          code: "custom",
          path: ["data", key],
          message: "Use an HTTPS URL or local path",
        });
    }
    if (v.data.gallery !== undefined) {
      const gallery = z
        .array(
          z.object({
            url,
            alt: z.string().trim().min(1).max(500),
            type: z.enum(["image", "video"]).optional(),
          }),
        )
        .max(1000)
        .safeParse(v.data.gallery);
      if (!gallery.success)
        ctx.addIssue({
          code: "custom",
          path: ["data", "gallery"],
          message: "Gallery assets require valid URLs and alt text",
        });
    }
    if (
      v.data.statistics !== undefined &&
      !z
        .record(z.string(), z.number().finite().nonnegative())
        .safeParse(v.data.statistics).success
    )
      ctx.addIssue({
        code: "custom",
        path: ["data", "statistics"],
        message: "Statistics must be nonnegative numbers",
      });
    if (v.collection === "statistics" && !Number.isFinite(Number(v.data.value)))
      ctx.addIssue({
        code: "custom",
        path: ["data", "value"],
        message: "Enter a numeric statistic",
      });
    if (v.image && !v.imageAlt)
      ctx.addIssue({
        code: "custom",
        path: ["imageAlt"],
        message: "Image alt text is required",
      });
    if (
      v.status === "SCHEDULED" &&
      (!v.publishAt || !Number.isFinite(Date.parse(v.publishAt)))
    )
      ctx.addIssue({
        code: "custom",
        path: ["publishAt"],
        message: "A valid publication time is required",
      });
  });
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(10000),
  website: z.string().max(0).optional(),
});
export const userSchema = z.object({
  email: z.email(),
  name: z.string().min(2).max(100),
  password: z.string().min(12).max(128),
  role: z.enum(roles),
});
