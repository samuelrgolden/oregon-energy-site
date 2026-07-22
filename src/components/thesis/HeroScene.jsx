import { PinScene, phase, ease } from "../../lib/scroll";

const QUESTION_WORDS = "What does that actually do to its grid?".split(" ");

const ANSWER = [
  { text: "I modeled ten years of PACW demand and emissions against climate data, then turned the temperature up 15 degrees. The answer: warming barely moves the needle — and the biggest " },
  { text: "climate win", accent: true },
  { text: " on the books turned out to be an " },
  { text: "accounting trick.", accent: true },
];

/**
 * Scene 1 (pinned):
 *   0.00–0.45  "Oregon is warming." holds; the question — inline beside it,
 *              fully invisible at rest — reveals word by word
 *   0.50–0.64  the whole headline slides up and fades
 *   0.62–0.86  the answer paragraph slides up into view
 *   0.86–1.00  brief hold, then the pin releases and the track collapses
 */
export default function HeroScene() {
  return (
    <PinScene id="top" heightVh={280} mobileHeightVh={190}>
      {(p) => {
        const reveal = phase(p, 0, 0.45);
        const exit = ease(phase(p, 0.5, 0.64));
        const answer = ease(phase(p, 0.62, 0.86));

        return (
          <div className="relative flex h-full flex-col justify-center">
            <div className="mx-auto w-full max-w-[1440px] px-6 md:px-12">
              {/* Beat 1: statement + inline scrubbed question */}
              <h1
                className="display text-[clamp(2.3rem,5.8vw,5.2rem)]"
                style={{
                  transform: `translateY(${-60 * exit}px)`,
                  opacity: 1 - exit,
                }}
              >
                Oregon is warming.{" "}
                <span
                  className="italic text-[hsl(var(--accent))]"
                  aria-label="What does that actually do to its grid?"
                >
                  {QUESTION_WORDS.map((w, i) => {
                    const wp = phase(reveal, i / QUESTION_WORDS.length, (i + 1) / QUESTION_WORDS.length);
                    return (
                      <span key={i} aria-hidden="true" style={{ opacity: wp }}>
                        {w}{" "}
                      </span>
                    );
                  })}
                </span>
              </h1>

              {/* Beat 2: the answer */}
              <div
                className="absolute inset-x-6 top-1/2 md:inset-x-12"
                style={{
                  transform: `translateY(calc(-50% + ${70 * (1 - answer)}px))`,
                  opacity: answer,
                  pointerEvents: answer > 0.5 ? "auto" : "none",
                }}
              >
                <div className="mx-auto max-w-[1440px]">
                  <p className="smallcaps mb-5">The short version</p>
                  <p className="serif max-w-3xl text-[clamp(1.3rem,2.6vw,2.1rem)] leading-relaxed text-[hsl(var(--ink))]">
                    {ANSWER.map((seg, i) =>
                      seg.accent ? (
                        <em key={i} className="text-[hsl(var(--accent))]">
                          {seg.text}
                        </em>
                      ) : (
                        <span key={i}>{seg.text}</span>
                      )
                    )}
                  </p>
                  <p className="mt-6 text-sm text-[hsl(var(--muted))]">
                    Sam Golden · Climate and the Oregon Energy Grid · University of Oregon, 2026
                  </p>
                </div>
              </div>
            </div>

            <div className="scroll-hint" style={{ opacity: p > 0.03 ? 0 : 1 }}>
              <span className="smallcaps">Scroll</span>
              <svg className="chev" width="14" height="8" viewBox="0 0 14 8" aria-hidden="true">
                <path d="M1 1l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        );
      }}
    </PinScene>
  );
}
