// src/components/shared/NavThread.tsx
import { useEffect, useState } from "react";

interface Thread {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function NavThread() {
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    const handleNavClick = (e: Event) => {
      const { startX, startY } = (e as CustomEvent).detail;

      const content = document.querySelector("[data-nav-content]");
      if (!content) return;
      const rect = content.getBoundingClientRect();

      // نقطه پایانی: نزدیک گوشه بالا-راست محتوا
      const endX = rect.right - 32;
      const endY = rect.top + 80;

      const newThread: Thread = {
        id: Date.now() + Math.random(),
        startX,
        startY,
        endX,
        endY,
      };

      setThreads((prev) => [...prev, newThread]);

      // پاک کردن بعد از اتمام انیمیشن
      setTimeout(() => {
        setThreads((prev) => prev.filter((t) => t.id !== newThread.id));
      }, 700);
    };

    window.addEventListener("nav-click", handleNavClick);
    return () => window.removeEventListener("nav-click", handleNavClick);
  }, []);

  return (
    <>
      {threads.map((thread) => {
        const dx = thread.endX - thread.startX;
        const dy = thread.endY - thread.startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        return (
          <div
            key={thread.id}
            className="pointer-events-none fixed z-[100]"
            style={{ left: thread.startX, top: thread.startY }}
          >
            {/* نقطه شروع درخشان */}
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#007aff]"
              style={{
                width: 8,
                height: 8,
                boxShadow: "0 0 16px 4px rgba(0, 122, 255, 0.7)",
                animation: "threadDot 0.55s ease-out forwards",
              }}
            />

            {/* خط نخ */}
            <div
              className="absolute h-[2px] rounded-full bg-gradient-to-l from-[#007aff] via-[#007aff]/60 to-transparent"
              style={{
                left: 0,
                top: -1,
                width: 0,
                transformOrigin: "left center",
                ["--angle" as any]: `${angle}deg`,
                ["--len" as any]: `${length}px`,
                animation: "threadBeam 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            />
          </div>
        );
      })}

      <style>{`
        @keyframes threadBeam {
          0% {
            width: 0;
            opacity: 0;
            transform: rotate(var(--angle));
          }
          15% {
            opacity: 1;
          }
          80% {
            width: var(--len);
            opacity: 1;
            transform: rotate(var(--angle));
          }
          100% {
            width: var(--len);
            opacity: 0;
            transform: rotate(var(--angle));
          }
        }
        @keyframes threadDot {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
          }
          40% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.6);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </>
  );
}

export default NavThread;