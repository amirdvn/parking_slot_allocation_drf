
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
  const [isDesktop, setIsDesktop] = useState(
    () => window.innerWidth >= 1024
  );

  const { pathname } = useLocation();

  const animationRef = useRef<number | null>(null);
  const frameRef = useRef<FrameData | null>(null);

  const computeFrame = useCallback(() => {
    if (window.innerWidth < 1024) {
      frameRef.current = null;
      setFrame(null);
      return;
    }

    const icon = document.querySelector(
      '[data-active-nav="true"] [data-icon="true"]'
    ) as HTMLElement | null;

    const content = document.querySelector(
      "[data-nav-content]"
    ) as HTMLElement | null;

    if (!icon || !content) {
      frameRef.current = null;
      setFrame(null);
      return;
    }

    const ir = icon.getBoundingClientRect();
    const cr = content.getBoundingClientRect();

    if (
      ir.width === 0 ||
      ir.height === 0 ||
      cr.width === 0 ||
      cr.height === 0
    ) {
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

    // جلوگیری از رندرهای غیرضروری
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

  // زمان‌بندی محاسبه برای جلوگیری از چند رندر در یک فریم
  const scheduleCompute = useCallback(() => {
    if (animationRef.current !== null) {
      return;
    }

    animationRef.current = requestAnimationFrame(() => {
      animationRef.current = null;
      computeFrame();
    });
  }, [computeFrame]);

  // تشخیص اندازه صفحه
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      scheduleCompute();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [scheduleCompute]);

  // مشاهده تغییر اندازه عناصر
  useEffect(() => {
    if (!isDesktop) {
      frameRef.current = null;
      setFrame(null);
      return;
    }

    const content = document.querySelector(
      "[data-nav-content]"
    ) as HTMLElement | null;

    const sidebar = document.querySelector(
      "[data-sidebar]"
    ) as HTMLElement | null;

    const icon = document.querySelector(
      '[data-active-nav="true"] [data-icon="true"]'
    ) as HTMLElement | null;

    if (!content || !icon) {
      scheduleCompute();
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      scheduleCompute();
    });

    resizeObserver.observe(content);

    if (sidebar) {
      resizeObserver.observe(sidebar);
    }

    resizeObserver.observe(icon);

    // تغییر موقعیت هنگام اسکرول
    window.addEventListener("scroll", scheduleCompute, true);

    // تغییر مسیر یا تغییرات DOM
    const mutationObserver = new MutationObserver(() => {
      scheduleCompute();
    });

    mutationObserver.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: [
        "class",
        "style",
        "data-active-nav",
      ],
    });

    scheduleCompute();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();

      window.removeEventListener("scroll", scheduleCompute, true);
    };
  }, [isDesktop, pathname, scheduleCompute]);

  // پاکسازی RAF
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!isDesktop || !frame) {
    return null;
  }

  const { iconX, iconY, x1, y1, x2, y2 } = frame;

  // شعاع گوشه‌ها متناسب با اندازه قاب
  const r = Math.min(
    20,
    Math.max(8, (x2 - x1) / 30),
    Math.max(8, (y2 - y1) / 30)
  );

  const width = x2 - x1;
  const height = y2 - y1;

  if (width <= r * 2 || height <= r * 2) {
    return null;
  }

  // نقطه اتصال نخ به قاب
  const entryY = Math.max(
    y1 + r + 4,
    Math.min(y2 - r - 4, iconY)
  );

  const connectorLen = Math.hypot(
    iconX - x2,
    iconY - entryY
  );

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
      aria-hidden="true"
      className="
        pointer-events-none
        fixed inset-0
        z-[35]
        h-screen w-screen
        overflow-visible
      "
      width="100%"
      height="100%"
      viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
      preserveAspectRatio="none"
    >
      {/* نخ اتصال آیکون به قاب */}
      <line
        x1={iconX}
        y1={iconY}
        x2={x2}
        y2={entryY}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-gray-400 dark:text-gray-600"
      />

      {/* قاب دور محتوای اصلی */}
      <path
        d={framePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-400 dark:text-gray-600"
      />
    </svg>
  );
}

export default NavFrame;
