import { useEffect, useRef, useState } from "react";

type Direction = "up" | "down";

export function AnimatedStat({
  value,
  direction,
}: {
  value: number;
  direction: Direction;
}) {
  const [animClass, setAnimClass] = useState("");
  const prev = useRef(value);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prev.current = value;
      return;
    }
    if (prev.current === value) return;
    prev.current = value;
    setAnimClass(direction === "up" ? "animate-stat-up" : "animate-stat-down");
    const t = window.setTimeout(() => setAnimClass(""), 500);
    return () => clearTimeout(t);
  }, [value, direction]);

  return (
    <span className={`inline-block tabular-nums ${animClass}`}>{value}</span>
  );
}
