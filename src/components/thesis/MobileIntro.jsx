/**
 * Phones only: a pinned scene's heading and copy, set in normal flow just
 * above its pinned frame. The reader gets the "why" first, and the pinned
 * screen can give its whole height to the slider and charts.
 */
export default function MobileIntro({ num, title, kicker, children }) {
  return (
    <div className="px-6 pb-2 pt-10">
      <h2 className="display text-[2rem]">
        <span className="text-[hsl(var(--accent))]">{num}</span> — {title}
      </h2>
      {kicker && <p className="smallcaps mt-5 font-medium text-[hsl(var(--accent))]">{kicker}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}
