import { useEffect, useRef } from "react";

export default function Reveal({ as: Tag = "div", className = "", delay = 0, style, children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let io;
    const cleanup = () => {
      io?.disconnect();
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
    const show = () => {
      el.classList.add("in");
      cleanup();
    };
    function check() {
      const vh = window.innerHeight || document.documentElement.clientHeight || 900;
      if (el.getBoundingClientRect().top < vh * 0.92) show();
    }
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && show()),
        { threshold: 0.12, rootMargin: "9999px 0px -8% 0px" }
      );
      io.observe(el);
    }
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    check();
    return cleanup;
  }, []);
  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms`, ...style } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
