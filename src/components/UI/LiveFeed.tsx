import { useEffect, useRef } from "react";
import { useLiveFeed } from "../../hooks/useApiData";

const typeColors: Record<string, string> = {
  settlement: "#4DFFB8", dispute: "#FF4D6A", promotion: "#7B61FF", recruitment: "#00D4FF",
  slashing: "#FF4D6A", task_posted: "#6B7A8D", alliance_formed: "#FFB800", agent_joined: "#00D4FF",
};

export default function LiveFeed() {
  const feed = useLiveFeed();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let offset = 0;
    let frame: number;
    const animate = () => {
      offset += 0.25;
      if (offset > el.scrollWidth / 2) offset = 0;
      el.scrollLeft = offset;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const doubled = [...feed, ...feed];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40" style={{ background: "linear-gradient(0deg, rgba(10,14,26,0.9) 0%, transparent 100%)" }}>
      <div ref={scrollRef} className="flex gap-6 px-8 pb-4 pt-6 overflow-hidden">
        {doubled.map((ev, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <span className="w-1 h-1 rounded-full shrink-0" style={{ background: typeColors[ev.eventType] ?? "#4A5568" }} />
            <span className="text-[9px] whitespace-nowrap" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#8899AA" }}>{ev.description}</span>
            <span className="text-[8px] whitespace-nowrap" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#4A5568" }}>{ev.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
