import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "../../shared/components/common/Header";

const STAR_SEED = 42;
const mulberry32 = (a) => () => ((a += 0x6d2b79f5) | 0) >>> 0;
const seededRandom = (seed) => {
  const next = mulberry32(seed);
  return () => next() / 0xffffffff;
};

const TWINKLE_STARS = [
  { left: "12%", top: "22%", d: "delay-1" },
  { left: "88%", top: "18%", d: "delay-2" },
  { left: "45%", top: "35%", d: "delay-3" },
  { left: "72%", top: "55%", d: "delay-4" },
  { left: "8%",  top: "70%", d: "delay-5" },
  { left: "92%", top: "78%", d: "delay-6" },
  { left: "28%", top: "85%", d: "delay-7" },
  { left: "55%", top: "12%", d: "delay-8" },
  { left: "35%", top: "62%", d: "delay-9" },
  { left: "78%", top: "42%", d: "delay-10" },
];

export function AppShell() {
  const starStyle = useMemo(() => {
    const rnd = seededRandom(STAR_SEED);
    const shadows = Array.from({ length: 120 }, () => {
      const x = rnd() * 100;
      const y = rnd() * 100;
      const size = rnd() > 0.92 ? 1.5 : 0.5;
      const opacity = 0.3 + rnd() * 0.7;
      return `${x}vw ${y}vh 0 ${size}px rgba(255,255,255,${opacity.toFixed(2)})`;
    }).join(", ");
    return { boxShadow: shadows };
  }, []);

  return (
    <div
      className="fixed inset-0 w-full h-full min-h-screen text-white selection:bg-purple-500/50 overflow-auto"
      style={{
        background: "radial-gradient(ellipse at top, #0a0b1f 0%, #030306 50%, #000000 100%)",
      }}
    >
      {/* 레이어 0: 배경 그라데이션 흐름 */}
      <div
        className="absolute inset-0 pointer-events-none -z-20 animate-gradient-flow"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 40%, rgba(88,28,135,0.15) 0%, transparent 50%), radial-gradient(ellipse 60% 80% at 80% 60%, rgba(6,78,59,0.12) 0%, transparent 50%), radial-gradient(ellipse 50% 50% at 50% 80%, rgba(30,58,138,0.1) 0%, transparent 55%)",
          backgroundPosition: "0% 50%",
        }}
        aria-hidden
      />

      {/* 레이어 1: 별 */}
      <div
        className="absolute inset-0 w-0 h-0 pointer-events-none -z-10 animate-star-drift"
        style={starStyle}
        aria-hidden
      />

      {/* 레이어 2: 은하수 */}
      <div className="absolute pointer-events-none -z-10 w-[140%] h-[50%] -left-[20%] top-[15%] opacity-40 animate-nebula-drift">
        <div
          className="w-full h-full"
          style={{
            background:
              "linear-gradient(105deg, transparent 0%, rgba(180,160,255,0.08) 25%, rgba(255,255,255,0.12) 50%, rgba(200,220,255,0.08) 75%, transparent 100%)",
            filter: "blur(80px)",
            transform: "rotate(-12deg)",
          }}
          aria-hidden
        />
      </div>
      <div className="absolute pointer-events-none -z-10 w-[100%] h-[35%] left-[-10%] bottom-[10%] opacity-30 animate-nebula-float">
        <div
          className="w-full h-full"
          style={{
            background:
              "linear-gradient(75deg, transparent 0%, rgba(120,100,200,0.1) 50%, transparent 100%)",
            filter: "blur(100px)",
            transform: "rotate(5deg)",
          }}
          aria-hidden
        />
      </div>

      {/* 성운 블롭 */}
      <div
        className="absolute pointer-events-none -z-10 w-[70%] h-[60%] top-[5%] right-[-15%] animate-nebula-pulse"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(139,92,246,0.2) 0%, rgba(59,130,246,0.08) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
        aria-hidden
      />
      <div
        className="absolute pointer-events-none -z-10 w-[50%] h-[50%] bottom-[0%] left-[-10%] animate-nebula-drift"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(6,182,212,0.15) 0%, rgba(34,211,238,0.06) 45%, transparent 70%)",
          filter: "blur(80px)",
        }}
        aria-hidden
      />
      <div
        className="absolute pointer-events-none -z-10 w-[40%] h-[50%] top-[40%] left-[20%] animate-nebula-float"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(168,85,247,0.12) 0%, rgba(236,72,153,0.06) 50%, transparent 70%)",
          filter: "blur(70px)",
        }}
        aria-hidden
      />

      {/* 반짝이는 별 */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        {TWINKLE_STARS.map((s, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full bg-white star-twinkle ${s.d}`}
            style={{ left: s.left, top: s.top }}
            aria-hidden
          />
        ))}
      </div>

      {/* 배경 Orb */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-800/15 rounded-full blur-[150px] -z-10 animate-nebula-drift" aria-hidden />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/15 rounded-full blur-[150px] -z-10 animate-nebula-float" aria-hidden />

      {/* 콘텐츠 레이어 */}
      <div className="relative z-10 flex flex-col min-h-full">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
