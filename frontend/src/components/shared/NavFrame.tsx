// src/components/shared/NavFrame.tsx
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";

function NavFrame() {
  const [frame, setFrame] = useState<{
    iconX: number;
    iconY: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const { pathname } = useLocation();

  const computeFrame = useCallback(() => {
    if (window.innerWidth < 1024) {
      setFrame(null);
      return;
    }

    // پیدا کردن آیکون فعال و کادر محتوا
    const icon = document.querySelector(
      '[data-active-nav="true"] [data-icon="true"]'
    ) as HTMLElement | null;
    const content = document.querySelector("[data-nav-content]") as HTMLElement | null;

    if (!icon || !content) {
      setFrame(null);
      return;
    }

    const ir = icon.getBoundingClientRect();
    const cr = content.getBoundingClientRect();

    if (ir.width === 0 || ir.height === 0 || cr.width === 0 || cr.height === 0) {
      return;
    }

    setFrame({
      iconX: ir.left + ir.width / 2,
      iconY: ir.top + ir.height / 2,
      x1: cr.left,
      y1: cr.top,
      x2: cr.right,
      y2: cr.bottom,
    });
  }, []);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    let raf: number;
    // هر بار که اندازه کارت یا سایدبار عوض شد، نخ رو دوباره محاسبه کن
    const observer = new ResizeObserver(() => {
      raf = requestAnimationFrame(computeFrame);
    });

    const content = document.querySelector("[data-nav-content]");
    const icon = document.querySelector('[data-active-nav="true"] [data-icon="true"]');
    const sidebar = document.querySelector("[data-sidebar]");

    if (content) observer.observe(content);
    if (icon) observer.observe(icon);
    if (sidebar) observer.observe(sidebar);

    // محاسبه اولیه
    computeFrame();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [isDesktop, pathname, computeFrame]);

  if (!isDesktop || !frame) return null;

  const { iconX, iconY, x1, y1, x2, y2 } = frame;
  const r = 16;
  const w = x2 - x1;
  const h = y2 - y1;
  const perimeter = 2 * (w + h) + 40;

  // نقطه اتصال نخ به لبه راست کادر
  const entryY = Math.max(y1 + r + 4, Math.min(y2 - r - 4, iconY));
  const connectorLen = Math.hypot(iconX - x2, iconY - entryY);

  // مسیر قاب
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
      className="pointer-events-none fixed inset-0 z-20 h-full w-full"
    >
      {/* 👇 نخ اتصال */}
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
          animation: "navframe-line 0.3s ease-out forwards",
        }}
      />
      {/* 👇 قاب */}
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
          animation: "navframe-draw 0.7s ease-out 0.3s forwards",
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