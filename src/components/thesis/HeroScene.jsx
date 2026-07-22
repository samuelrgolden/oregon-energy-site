import { PinScene, phase, ease } from "../../lib/scroll";

const QUESTION_WORDS = "What does that actually do to its grid?".split(" ");

const STATEMENT_2 =
  "I modeled ten years of PACW demand and emissions against climate data to project forward through time";

/**
 * Scene 1 (pinned):
 *   0.00–0.40  "Oregon is warming." + inline question (invisible at rest)
 *              revealed word by word, the pair spanning the full screen width
 *   0.46–0.60  the headline slides up and fades
 *   0.58–0.76  "I modeled ten years…" takes its place
 *   0.80–0.92  "Here is what I found ↓" appears, prompting the reader on
 *   0.92–1.00  brief hold, then the pin releases into Finding 1
 */
export default function HeroScene() {
  return (
    <PinScene id="top" heightVh={280} mobileHeightVh={190}>
      {(p) => {
        const reveal = phase(p, 0, 0.4);
        const exit = ease(phase(p, 0.46, 0.6));
        const enter2 = ease(phase(p, 0.58, 0.76));
        const cta = ease(phase(p, 0.8, 0.92));

        return (
          <div className="relative flex h-full flex-col justify-center">
            <div className="w-full px-6 md:px-12">
              {/* Beat 1: statement + inline scrubbed question, full-bleed */}
              <h1
                className="display text-center text-[clamp(1.9rem,3.05vw,4.2rem)] md:whitespace-nowrap"
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

              {/* Beat 2: what I did */}
              <div
                className="absolute inset-x-6 top-1/2 md:inset-x-12"
                style={{
                  transform: `translateY(calc(-50% + ${70 * (1 - enter2)}px))`,
                  opacity: enter2,
                  pointerEvents: enter2 > 0.5 ? "auto" : "none",
                }}
              >
                <div className="mx-auto max-w-4xl text-center">
                  <p className="serif text-[clamp(1.5rem,3vw,2.6rem)] leading-snug text-[hsl(var(--ink))]">
                    {STATEMENT_2}
                  </p>
                  <p className="mt-5 text-sm text-[hsl(var(--muted))]">
                    Sam Golden · Climate and the Oregon Energy Grid · University of Oregon, 2026
                  </p>

                  {/* Beat 3: the prompt onward */}
                  <div
                    className="mt-14 flex flex-col items-center gap-3"
                    style={{
                      opacity: cta,
                      transform: `translateY(${24 * (1 - cta)}px)`,
                    }}
                  >
                    <p className="serif text-[clamp(1.1rem,1.8vw,1.5rem)] italic text-[hsl(var(--accent))]">
                      Here is what I found
                    </p>
                    <svg className="chev text-[hsl(var(--accent))]" width="20" height="12" viewBox="0 0 20 12" aria-hidden="true">
                      <path d="M2 2l8 8 8-8" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
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
