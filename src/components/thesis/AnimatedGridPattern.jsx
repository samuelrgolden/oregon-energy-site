import { useEffect, useId, useRef, useState } from "react";

/**
 * Hand-port of Magic UI's AnimatedGridPattern (the 21st.dev demo): an SVG
 * grid with randomly placed cells that fade in, hold, fade out, then jump
 * to a new random cell. Verbatim geometry and lifecycle — framer-motion
 * replaced with a CSS keyframe (fade up 4s, hold ~0.5s, reverse 4s) whose
 * end event triggers the reposition, exactly like onAnimationComplete.
 */
export default function AnimatedGridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 50,
  className = "",
  maxOpacity = 0.5,
  ...props
}) {
  const id = useId();
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [squares, setSquares] = useState([]);

  const getPos = () => [
    Math.floor((Math.random() * dimensions.width) / width),
    Math.floor((Math.random() * dimensions.height) / height),
  ];

  useEffect(() => {
    if (dimensions.width && dimensions.height) {
      setSquares(
        Array.from({ length: numSquares }, (_, i) => ({
          id: i,
          pos: [
            Math.floor((Math.random() * dimensions.width) / width),
            Math.floor((Math.random() * dimensions.height) / height),
          ],
        }))
      );
    }
  }, [dimensions.width, dimensions.height, numSquares, width, height]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions((cur) => {
          const w = entry.contentRect.width;
          const h = entry.contentRect.height;
          return cur.width === w && cur.height === h ? cur : { width: w, height: h };
        });
      }
    });
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  const updateSquarePosition = (squareId) => {
    setSquares((cur) => {
      const current = cur[squareId];
      if (!current || current.id !== squareId) return cur;
      const next = cur.slice();
      next[squareId] = { ...current, pos: getPos() };
      return next;
    });
  };

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full fill-[hsl(var(--accent)/0.3)] stroke-[hsl(var(--accent)/0.3)] ${className}`}
      {...props}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={`M.5 ${height}V.5H${width}`} fill="none" strokeDasharray={strokeDasharray} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      <svg x={x} y={y} className="overflow-visible">
        {squares.map(({ pos: [squareX, squareY], id: sqId }, index) => (
          <rect
            key={sqId}
            className="grid-cell"
            style={{ "--max-o": maxOpacity, animationDelay: `${index * 0.1}s` }}
            onAnimationIteration={() => updateSquarePosition(sqId)}
            width={width - 1}
            height={height - 1}
            x={squareX * width + 1}
            y={squareY * height + 1}
            fill="currentColor"
            strokeWidth="0"
          />
        ))}
      </svg>
    </svg>
  );
}
