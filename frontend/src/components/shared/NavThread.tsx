// src/components/shared/NavFrame.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";

interface FrameData {
  iconX: number;
  iconY: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function NavFrame() {
  const [frame, setFrame] = useState<FrameData | null>(null);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const { pathname } = useLocation();
  const animationRef = useRef<number | null>(null);
  const frameRef = useRef<FrameData | null>(null);

  const computeFrame = useCallback(() => {
    if (window.innerWidth < 1024) {
      frameRef.current = null;
      setFrame(null);
      return;
    }

    const icon = document.querySelector('[data-active-nav="true"] [data-icon="true"]') as HTMLElement | null;
    const content = document.querySelector("[data-nav-content]") as HTMLElement | null;

    if (!icon || !content) {
      frameRef.current = null;
      setFrame(null);
      return;
    }

    const ir = icon.getBoundingClientRect();
    const cr = content.getBoundingClientRect();

    if (ir.width === 0 || ir.height === 0 || cr.width === 0 || cr.height === 0) {
      return;
    }

    const nextFrame: FrameData = {
      iconX: ir.left + ir.width / 2,
      iconY: ir.top + ir.height / 2,
      x1: cr.left,
      y1: cr.top,
      x2: cr.right,
      y2: cr.bottom,
    };

    const previous = frameRef.current;
    if (
      previous &&
      Math.abs(previous.iconX - nextFrame.iconX) < 0.2 &&
      Math.abs(previous.iconY - nextFrame.iconY) < 0.2 &&
      Math.abs(previous.x1 - nextFrame.x1) < 0.2 &&
      Math.abs(previous.y1 - nextFrame.y1) < 0.2 &&
      Math.abs(previous.x2 - nextFrame.x2) < 0.2 &&
      Math.abs(previous.y2 - nextFrame.y2) < 0.2
    ) {
      return;
    }

    frameRef.current = nextFrame;
    setFrame(nextFrame);
  }, []);

  const scheduleCompute = useCallback(() => {
    if (animationRef.current !== null) return;
    animationRef.current = requestAnimationFrame(() => {
      animationRef.current = null;
      computeFrame();
    });
  }, [computeFrame]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      scheduleCompute();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [scheduleCompute]);

  useEffect(() => {
    if (!isDesktop) {
      frameRef.current = null;
      setFrame(null);
      return;
    }

    const content = document.querySelector("[data-nav-content]") as HTMLElement | null;
    const sidebar = document.querySelector("[data-sidebar]") as HTMLElement | null;
    const icon = document.querySelector('[data-active-nav="true"] [data-icon="true"]') as HTMLElement | null;

    if (!content || !icon) {
      scheduleCompute();
      return;
    }

    const resizeObserver = new ResizeObserver(() => scheduleCompute());
    resizeObserver.observe(content);
    if (sidebar) resizeObserver.observe(sidebar);
    resizeObserver.observe(icon);

    window.addEventListener("scroll", scheduleCompute, true);

    const mutationObserver = new MutationObserver(() => scheduleCompute());
    mutationObserver.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["class", "style", "data-active-nav"],
    });

    scheduleCompute();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", scheduleCompute, true);
    };
  }, [isDesktop, pathname, scheduleCompute]);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  if (!isDesktop || !frame) return null;

  const { iconX, iconY, x1, y1, x2, y2 } = frame;
  const r = Math.min(20, Math.max(8, (x2 - x1) / 30), Math.max(8, (y2 - y1) / 30));
  const width = x2 - x1;
  const height = y2 - y1;

  if (width <= r * 2 || height <= r * 2) return null;

  const entryY = Math.max(y1 + r + 4, Math.min(y2 - r - 4, iconY));
  const perimeter = 2 * (width + height) + 40;
  const connectorLen = Math.hypot(iconX - x2, iconY - entryY);

  const framePath = `
    M ${x2} ${entryY}
    L ${x2} ${y1 + r}
    Q ${x2} ${y1} ${x2 - r} ${y1}
    L ${x1 + r} ${y1}
    Q ${x1} ${y1} ${x1} ${y1 + r}
    L ${x1} ${y2 - r}
    Q ${x1} ${y2} ${x1 + r} ${y2}
    L ${x2 - r} ${y2}
    Q ${x2} ${y2} ${x2} ${y2 - r}
    L ${x2} ${entryY}
  `.trim();

  return (
    <svg
      key={pathname}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[35] h-screen w-screen overflow-visible"
      width="100%"
      height="100%"
      viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
      preserveAspectRatio="none"
    >
      <line
        x1={iconX}
        y1={iconY}
        x2={x2}
        y2={entryY}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-gray-400 dark:text-gray-600"
        style={{
          strokeDasharray: connectorLen,
          strokeDashoffset: connectorLen,
          animation: "navframe-line 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      />
      <path
        d={framePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-400 dark:text-gray-600"
        style={{
          strokeDasharray: perimeter,
          strokeDashoffset: perimeter,
          animation: "navframe-draw 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards",
        }}
      />
      <style>{`
        @keyframes navframe-line { to { stroke-dashoffset: 0; } }
        @keyframes navframe-draw { to { stroke-dashoffset: 0; } }
      `}</style>
    </svg>
  );
}

export default NavFrame;