import { blankEntry, type Entry } from "./content";
const pages = [
  [
    "about",
    "Connected by purpose.",
    "Two perspectives. One connected community.",
    "We bring together research, innovation, leadership and professional development to advance technology for the benefit of our community.",
  ],
  [
    "leadership",
    "Leadership",
    "The people bringing our shared purpose to life.",
    "",
  ],
  [
    "activities",
    "Activities, with impact.",
    "Explore the programs, workshops, conferences and initiatives shaping our community.",
    "",
  ],
  [
    "research",
    "Research",
    "Questions that challenge us. Ideas that move us forward.",
    "",
  ],
  [
    "publications",
    "Publications",
    "Research and perspectives, shared with the world.",
    "",
  ],
  [
    "opportunities",
    "Opportunities",
    "Find your next way to learn, collaborate and contribute.",
    "",
  ],
  [
    "resources",
    "Resources",
    "Knowledge, tools and documents for your next step.",
    "",
  ],
  [
    "news",
    "News",
    "Stories, perspectives and updates from across the chapter.",
    "",
  ],
  ["gallery", "Gallery", "Our community, in moments.", ""],
  [
    "membership",
    "Your next chapter.",
    "Bring your curiosity. Build what comes next.",
    "Learn together through workshops, technical programs and professional development. Build connections with researchers, students and industry professionals. Make an impact by contributing your skills to humanitarian and pre-university initiatives.",
  ],
  [
    "contact",
    "Let’s connect.",
    "A conversation is where collaboration begins.",
    "",
  ],
  [
    "search",
    "Explore JCTS.",
    "Find your way to ideas, people and possibilities.",
    "",
  ],
  [
    "privacy",
    "Privacy",
    "Your information, handled with care.",
    "Contact forms collect your name, email address, subject and message so chapter administrators can respond to your enquiry. Messages are stored in the chapter database and accessible to authorized chapter administrators.\n\nAdministrator sign-in uses an essential, HTTP-only session cookie that expires after 12 hours. This website does not include advertising trackers.\n\nFor questions about your information or a deletion request, use the contact form.",
  ],
  [
    "terms",
    "Terms",
    "Using the chapter website.",
    "This website presents information about IEEE JCTS Pune Chapter activities and resources. Information may be updated by chapter administrators.\n\nExternal resources and registration links are operated by their respective providers. Contact the chapter about corrections or accessibility issues.",
  ],
];
export const seedPages: Entry[] = pages.map(([slug, title, summary, body]) => ({
  ...blankEntry,
  id: `page-${slug}`,
  collection: "pages",
  slug,
  title,
  summary,
  body,
  status: "PUBLISHED",
  data:
    slug === "about"
      ? {
          subheading: "Technology meets\nsystems thinking.",
          ctaHeading: "Learn. Connect. Contribute.",
          ctaDescription:
            "Explore technical workshops, research programs and community initiatives.",
          ctaText: "Discover activities",
          ctaUrl: "/activities",
        }
      : slug === "membership"
        ? {
            cards: [
              {
                title: "Learn together",
                description:
                  "Grow through workshops, technical programs and professional development.",
              },
              {
                title: "Build connections",
                description:
                  "Meet researchers, students and industry professionals.",
              },
              {
                title: "Make an impact",
                description:
                  "Contribute your skills to humanitarian and pre-university initiatives.",
              },
            ],
            ctaHeading: "Start a conversation.",
            ctaDescription:
              "Ask the chapter about membership, volunteering and collaboration.",
            ctaText: "Contact the chapter",
            ctaUrl: "/contact",
          }
        : {},
}));
