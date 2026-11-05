// src/components/shared/NavFrame.tsx
import { useEffect, useState } from "react";
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
  const [isDesktop, setIsDesktop] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setFrame(null);
      return;
    }

    let cancelled = false;

    const compute = () => {
      if (cancelled) return;

      const icon = document.querySelector(
        '[data-active-nav="true"] [data-icon="true"]'
      ) as HTMLElement | null;
      const content = document.querySelector(
        "[data-nav-content]"
      ) as HTMLElement | null;

      if (!icon || !content) {
        setFrame(null);
        return;
      }

      const ir = icon.getBoundingClientRect();
      const cr = content.getBoundingClientRect();

      if (ir.width === 0 || cr.width === 0) {
        setFrame(null);
        return;
      }

      setFrame({
        // مرکز آیکون سایدبار
        iconX: ir.left + ir.width / 2,
        iconY: ir.top + ir.height / 2,
        // لبه‌های محتوا
        x1: cr.left,
        y1: cr.top,
        x2: cr.right,
        y2: cr.bottom,
      });
    };

    const timer = window.setTimeout(compute, 40);
    window.addEventListener("resize", compute);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("resize", compute);
    };
  }, [pathname, isDesktop]);

  if (!isDesktop || !frame) return null;

  const { iconX, iconY, x1, y1, x2, y2 } = frame;
  const r = 20;
  const w = x2 - x1;
  const h = y2 - y1;
  const perimeter = 2 * (w + h) + 40;

  // 👇 نخ اتصال: از آیکون سایدبار به لبه راست محتوا (نقطه ورود)
  // نقطه ورود روی لبه راست، در ارتفاع آیکون (اما محدود به داخل قاب)
  const entryY = Math.max(y1 + r + 4, Math.min(y2 - r - 4, iconY));
  const connectorLen = Math.hypot(iconX - x2, iconY - entryY);

  // 👇 قاب: از نقطه ورود (x2, entryY) شروع می‌شه و دور می‌زنه
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
      className="pointer-events-none fixed inset-0 z-30 h-full w-full"
      style={{ pointerEvents: "none" }}
    >
      {/* 👇 نخ اتصال: از مرکز آیکون به لبه راست محتوا */}
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

      {/* 👇 قاب دور محتوا */}
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
          animation:
            "navframe-draw 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards",
        }}
      />

      <style>{`
        @keyframes navframe-line {
          to { stroke-dashoffset: 0; }
        }
        @keyframes navframe-draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}

export default NavFrame;