import { useRef, useState, useEffect } from "react";
import { useReducedMotion } from "framer-motion";
const chapters = [
  { word: "Technology", copy: "Explore what is possible.", index: "01" },
  { word: "Research", copy: "Ask the next question.", index: "02" },
  { word: "Community", copy: "Connect across disciplines.", index: "03" },
  { word: "Impact", copy: "Move ideas into the world.", index: "04" },
];
export default function NetworkStory() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const manual = useRef<number | null>(null);
  useEffect(() => {
    if (reduced) return;
    const update = () => {
      if (!ref.current) return;
      if (
        manual.current !== null &&
        Math.abs(window.scrollY - manual.current) < 20
      )
        return;
      manual.current = null;
      const bounds = ref.current.getBoundingClientRect();
      setActive(
        Math.max(
          0,
          Math.min(
            3,
            Math.floor(
              (-bounds.top + window.innerHeight * 0.35) / (bounds.height / 4),
            ),
          ),
        ),
      );
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [reduced]);
  return (
    <section
      className="network-story"
      ref={ref}
      aria-label="Technology, research, community and impact"
    >
      <div className="story-sticky page-width">
        <div className="story-overline">
          <span className="signal-dot" />
          CONNECTED INTELLIGENCE <span>SCROLL TO EXPLORE</span>
        </div>
        <div className="story-content">
          <div className="story-diagram" aria-hidden="true">
            <svg viewBox="0 0 500 300">
              <defs>
                <linearGradient id="signal">
                  <stop stopColor="#00629b" />
                  <stop offset="1" stopColor="#83c7df" />
                </linearGradient>
              </defs>
              {Array.from({ length: 5 }, (_, i) => (
                <path
                  key={i}
                  d={`M20 ${50 + i * 50} C150 ${300 - i * 40}, 280 ${i * 30}, 470 150`}
                  fill="none"
                  stroke="url(#signal)"
                  strokeWidth=".7"
                />
              ))}
              {[0, 1, 2, 3].map((i) => (
                <g
                  key={i}
                  className={active === i ? "story-node active" : "story-node"}
                >
                  <circle
                    cx={65 + i * 120}
                    cy={150 + Math.sin(i * 2) * 65}
                    r={active === i ? 12 : 6}
                  />
                  <circle
                    cx={65 + i * 120}
                    cy={150 + Math.sin(i * 2) * 65}
                    r="25"
                    fill="none"
                  />
                </g>
              ))}
            </svg>
          </div>
          <div className="story-words">
            {chapters.map((chapter, i) => (
              <button
                className={i === active ? "active" : ""}
                key={chapter.word}
                onClick={() => {
                  manual.current = window.scrollY;
                  setActive(i);
                }}
                aria-pressed={i === active}
              >
                <span>{chapter.index}</span>
                {chapter.word}
                <span className="story-word-copy">{chapter.copy}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="story-progress" aria-hidden="true">
          <span style={{ width: `${(active + 1) * 25}%` }} />
        </div>
      </div>
    </section>
  );
}
