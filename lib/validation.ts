import { z } from "zod";
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
        /(url|link|pdf)$/i.test(key) &&
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
