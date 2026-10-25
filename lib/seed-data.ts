import { blankEntry, slugify, type Entry } from "./content";
import { seedPages } from "./seed-pages";
const activity = (
  title: string,
  date: string,
  category: string,
  summary: string,
  data: Record<string, unknown> = {},
  featured = false,
): Entry => ({
  ...blankEntry,
  id: slugify(title),
  slug: slugify(title),
  title,
  date,
  category,
  summary,
  body: summary,
  status: "PUBLISHED",
  featured,
  homepage: featured,
  data,
});
export const seedEntries: Entry[] = [
  ...seedPages,
  ...[
    "Professional",
    "Technical",
    "Research",
    "Innovation",
    "Humanitarian",
    "Humanities",
    "Non-Technical",
    "Pre-University",
    "Administrative",
  ].map((title, i) => ({
    ...blankEntry,
    id: `category-${i}`,
    collection: "categories",
    slug: slugify(title),
    title,
    status: "PUBLISHED",
    data: { order: i },
  })),
  ...[
    ["upcoming", "Upcoming activities", "activities", "upcoming"],
    ["spotlight", "In the spotlight", "activities", "featured"],
    ["about", "Progress happens when minds connect.", "settings", "all"],
    ["statistics", "Impact, in numbers.", "statistics", "all"],
    ["partners", "Progress through collaboration.", "partners", "all"],
  ].map(([slug, title, source, selection], i) => ({
    ...blankEntry,
    id: `module-${slug}`,
    collection: "homepage",
    slug,
    title,
    status: "PUBLISHED",
    data: {
      order: i + 2,
      source,
      selection,
      itemCount: 3,
      enabled: true,
      kind: slug === "spotlight" ? "spotlight" : "collection",
    },
  })),
  ...[
    "Professional Development",
    "Technical",
    "Research",
    "Innovation",
    "Humanitarian Technology",
    "Pre-University",
    "Non-Technical",
    "Administrative",
  ].map((title, i) => ({
    ...blankEntry,
    id: `focus-${i}`,
    collection: "focus-areas",
    slug: slugify(title),
    title,
    status: "PUBLISHED",
    data: {
      url: `/activities?category=${encodeURIComponent(["Professional", "Technical", "Research", "Innovation", "Humanitarian", "Pre-University", "Non-Technical", "Administrative"][i])}`,
      order: i,
    },
  })),
  ...[
    [
      "activities",
      "From ideas to impact.",
      "The conversations, discoveries and experiences moving our community forward.",
    ],
    [
      "focus",
      "Many disciplines. One purpose.",
      "Room to explore. Space to make a difference.",
    ],
    [
      "knowledge",
      "Knowledge without boundaries.",
      "Research, perspectives and resources from a connected community.",
    ],
    ["news", "Across the chapter.", "Stories and updates from our community."],
    [
      "join",
      "Your curiosity. Our collective potential.",
      "Connect with a community that moves ideas forward.",
    ],
  ].map(([slug, title, summary], i) => ({
    ...blankEntry,
    id: `homepage-${slug}`,
    collection: "homepage",
    slug,
    title,
    summary,
    status: "PUBLISHED",
    data: { order: i },
  })),
  activity(
    "Eu-Reka’26 Kickoff",
    "2026-01-03",
    "Professional",
    "A kickoff for STEM, innovation and pre-university engagement.",
    { tags: ["Professional", "Pre-University"] },
  ),
  activity(
    "Kickoff Meeting",
    "2026-01-10",
    "Administrative",
    "Chapter planning and coordination for 2026.",
  ),
  activity(
    "Podcast — AI and Beyond",
    "2026-01-18",
    "Non-Technical",
    "A conversation on artificial intelligence and beyond.",
    { speakers: ["Mitra Desai"] },
  ),
  activity(
    "Code-Bhumi",
    "2026-02-28",
    "Technical",
    "A JCTS technical activity.",
  ),
  activity(
    "JSPM Rajsahu Seminar — Research in Data Science",
    "2026-03-14",
    "Technical",
    "Exploring research in data science.",
  ),
  activity(
    "PRAXIS",
    "2026-03-27",
    "Research",
    "A Premier Scholar’s Knowledge Exchange Program. A monthly recurring global hands-on workshop series featuring distinguished student speakers.",
    { highlights: ["Ethical Hacking and Dark Web", "Generative AI"] },
    true,
  ),
  activity(
    "Eu-Reka Registration Portal Launch",
    "2026-04-01",
    "Technical",
    "Launch of the Eu-Reka registration portal.",
  ),
  {
    ...activity(
      "Third International Conference on Trends in Quantum Computing and Emerging Business Technologies",
      "2026-04-09",
      "Research",
      "International collaboration, research innovation and knowledge exchange.",
      {
        highlights: [
          "Quantum Computing",
          "Artificial Intelligence & Machine Learning",
          "Cybersecurity & Privacy",
          "Data Science & Emerging Technologies",
          "Sustainable Computing & Digital Transformation",
        ],
        outcomes: [
          "International participation, keynote addresses, research presentations, panel discussions and academia-industry networking.",
        ],
      },
      true,
    ),
    endDate: "2026-04-11",
  },
  activity(
    "Campus to Corporate",
    "2026-05-30",
    "Professional",
    "Preparing for the transition from academic life to industry.",
    {
      speakers: ["Mr. Dhiraj Mani Chauraisa"],
      highlights: [
        "Corporate culture",
        "Communication and teamwork",
        "Upskilling and adaptability",
        "Career planning",
        "Leadership and professional ethics",
        "Workplace readiness",
      ],
    },
    true,
  ),
  activity(
    "Mastering the Art of Research Paper",
    "2026-06-05",
    "Research",
    "From a research question to a publication-ready paper.",
    {
      speakers: ["Dr. Neha Sharma"],
      highlights: [
        "Research methodology and problem identification",
        "Literature review and research planning",
        "Academic writing and paper structure",
        "Citation and plagiarism prevention",
        "Publication ethics",
        "Peer review and reviewer response",
      ],
    },
    true,
  ),
  activity(
    "Hack4Humanity",
    "2026-06-24",
    "Humanitarian",
    "Hands-on workshops connecting emerging technologies with social impact.",
    {
      speakers: [
        "Pradeep Kumar — Quantum Computing",
        "Ninad Deo — Cyber Security",
        "Rakshit Jain — AI for Good",
      ],
      highlights: [
        "Orientation and competition workflow",
        "Timelines and evaluation",
        "Project ideation",
        "Technology selection and implementation guidance",
      ],
    },
    true,
  ),
  {
    ...activity(
      "EU-REKA 2026",
      "",
      "Pre-University",
      "STEM • Innovation • Technology Dissemination • Social Impact",
      {
        statistics: {
          Teams: 659,
          Participants: 2636,
          States: 24,
          Cities: 94,
          Schools: 3468,
          "School Children": 219970,
          Mentors: 460,
          Teachers: 7419,
          Ambassadors: 167,
          Volunteers: 128,
        },
      },
      true,
    ),
    slug: "eureka-2026",
    id: "eureka-2026",
  },
  activity(
    "Hack4Humanity Finale",
    "2026-08-08",
    "Humanitarian",
    "10 teams recognized and 31 participants awarded across AI for Good, Cyber Security and Quantum Computing.",
    {
      highlights: [
        "10 teams recognized",
        "31 participants awarded",
        "AI for Good",
        "Cyber Security",
        "Quantum Computing",
      ],
    },
  ),
  activity(
    "Industry Meeting",
    "2026-08-09",
    "Professional",
    "Industry Interaction, Professional Networking & Knowledge Exchange.",
    {
      venue: "Hotel Ramee Grand",
      speakers: ["Sanjay Chaudhari — IEEE Kolkata Section"],
      highlights: [
        "Industry trends and emerging technologies",
        "Career opportunities and mentorship",
        "Industry-academia collaboration",
      ],
    },
  ),
  activity(
    "AI & Cyber for School",
    "2026-08-09",
    "Pre-University",
    "Artificial intelligence, cybersecurity and responsible internet usage.",
    {
      venue: "Saraswati International School Shrirampur",
      speakers: [
        "Ninad — Cybersecurity",
        "Maithilee — Artificial Intelligence",
      ],
      highlights: [
        "AI applications",
        "Online safety",
        "Digital privacy",
        "Responsible internet usage",
      ],
    },
  ),
  activity(
    "Skills for Success",
    "2026-10-03",
    "Professional",
    "Career Guidance & Professional Development.",
    {
      venue: "Saraswati International School",
      speakers: ["Mr. Avinash — Ex-Military Personnel & TCS Professional"],
      highlights: [
        "Career planning and professional growth",
        "Workplace expectations",
        "Discipline and dedication",
        "Adaptability",
      ],
    },
  ),
  {
    ...blankEntry,
    id: "homepage-hero",
    collection: "homepage",
    slug: "hero",
    title: "Technology. Research. Impact.",
    summary:
      "Advancing technology, research, innovation and professional excellence through a connected IEEE community.",
    status: "PUBLISHED",
    data: {
      eyebrow: "IEEE JCTS • PUNE SECTION",
      ctaText: "Explore activities",
      ctaUrl: "/activities",
    },
  },
  {
    ...blankEntry,
    id: "settings-chapter",
    collection: "settings",
    slug: "chapter",
    title: "IEEE JCTS Pune Chapter",
    summary:
      "Joint Chapter of IEEE Technology and Engineering Management Society & IEEE Systems Council, Pune Section",
    status: "PUBLISHED",
    data: {
      mission:
        "To advance, enhance, and improve essential management and leadership knowledge and skills of IEEE members.",
      vision:
        "To be the premier resource of essential management and leadership knowledge.",
    },
  },
  ...[
    "About",
    "Leadership",
    "Activities",
    "Research",
    "Opportunities",
    "Resources",
    "News",
    "Gallery",
    "Contact",
  ].map((title, i) => ({
    ...blankEntry,
    id: `nav-${i}`,
    collection: "navigation",
    slug: slugify(title),
    title,
    status: "PUBLISHED",
    data: { url: `/${slugify(title)}`, order: i },
  })),
].map((item) =>
  item.collection === "homepage"
    ? {
        ...item,
        data: {
          ...item.data,
          kind:
            item.slug === "hero"
              ? "hero"
              : item.slug === "join"
                ? "cta"
                : item.slug === "about"
                  ? "about"
                  : item.slug === "statistics"
                    ? "statistics"
                    : item.slug === "spotlight"
                      ? "spotlight"
                      : "collection",
          source:
            (
              {
                focus: "focus-areas",
                knowledge: "research",
                statistics: "activities",
              } as Record<string, string>
            )[item.slug] ||
            (item.data as Record<string, unknown>).source ||
            item.slug,
          selection:
            item.slug === "statistics"
              ? "with-statistics"
              : (item.data as Record<string, unknown>).selection ||
                (item.slug === "activities" ? "homepage" : "all"),
          order:
            (
              {
                hero: -100,
                about: 1,
                statistics: 2,
                focus: 3,
                upcoming: 4,
                activities: 5,
                spotlight: 6,
                knowledge: 7,
                news: 8,
                join: 9,
                partners: 10,
              } as Record<string, number>
            )[item.slug] ?? 0,
        },
      }
    : item,
);
