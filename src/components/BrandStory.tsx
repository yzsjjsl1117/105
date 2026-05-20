"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import styles from "./BrandStory.module.css";

interface Slide {
  id: number;
  image: string;
  englishTitle: string;
  chineseTitle: string;
  lines: string[];
  extraLines?: string[];
}

const slides: Slide[] = [
  {
    id: 1,
    image: "/images/tea-garden.png",
    englishTitle: "HUANGSHAN TEA · EST. 1875",
    chineseTitle: "源自黄山",
    lines: ["云雾深处，", "茶生山中。"],
    extraLines: ["高山气候与漫长时序，", "让风味缓慢沉淀。"],
  },
  {
    id: 2,
    image: "/images/spring-water.png",
    englishTitle: "SPRING WATER",
    chineseTitle: "山泉入茶",
    lines: [
      "源自皖南深山的天然山泉，",
      "经岩层渗滤，清冽甘润。",
    ],
    extraLines: ["好水，方能养出真正的好茶。"],
  },
  {
    id: 3,
    image: "/images/high-altitude.png",
    englishTitle: "HIGH ALTITUDE",
    chineseTitle: "高山慢养",
    lines: ["云雾缓慢生长，", "山风沉淀茶香。"],
    extraLines: ["时间，", "让鲜醇自然发生。"],
  },
  {
    id: 4,
    image: "/images/day-night-aroma.png",
    englishTitle: "DAY & NIGHT",
    chineseTitle: "昼夜凝香",
    lines: [
      "白昼云雾舒展茶芽，",
      "夜晚山风沉淀茶香。",
    ],
    extraLines: [
      "茶因此拥有更沉静的香气，",
      "与更悠长的山野回甘。",
    ],
  },
  {
    id: 5,
    image: "/images/wild-harmony.png",
    englishTitle: "WILD HARMONY",
    chineseTitle: "山野共生",
    lines: ["茶园隐于群山，远离城市喧嚣。"],
    extraLines: [
      "森林、山泉、云雾与茶树共生，",
      "自然，便是最好的种植者。",
    ],
  },
  {
    id: 6,
    image: "/images/four-seasons.png",
    englishTitle: "FOUR SEASONS",
    chineseTitle: "四时养茶",
    lines: [
      "春雾、夏雨、秋露与冬藏，",
      "让茶叶在四时流转中缓慢积蓄风味。",
    ],
    extraLines: ["时间，最终沉淀为茶汤中的甘甜与层次。"],
  },
];

export default function BrandStory() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const hasSeenAllRef = useRef(false);
  const hasCompletedCycleRef = useRef(false);
  const isScrollingRef = useRef(false);
  const pendingSlideRef = useRef<number | null>(null);

  const totalSlides = slides.length;

  const goTo = useCallback((index: number) => {
    setCurrent(index);
    if (index === totalSlides - 1) hasSeenAllRef.current = true;
  }, [totalSlides]);

  const transitionTo = useCallback((index: number) => {
    // 6→1 loop forward: no overlay
    const isLoopBack = current === totalSlides - 1 && index === 0;
    // 2→1 backward: no overlay
    const isBackToFirst = current === 1 && index === 0;
    if (isLoopBack || isBackToFirst) {
      goTo(index);
      return;
    }
    pendingSlideRef.current = index;
    setTransitioning(true);
  }, [current, totalSlides, goTo]);

  const onTransitionMid = useCallback(() => {
    if (pendingSlideRef.current !== null) {
      goTo(pendingSlideRef.current);
      pendingSlideRef.current = null;
    }
  }, [goTo]);

  const next = useCallback(() => {
    if (current < totalSlides - 1) transitionTo(current + 1);
    else {
      transitionTo(0);
      if (hasSeenAllRef.current) hasCompletedCycleRef.current = true;
    }
  }, [current, totalSlides, transitionTo]);

  const prev = useCallback(() => {
    if (current > 0) transitionTo(current - 1);
  }, [current, transitionTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        if (e.key === "ArrowRight") next();
        else if (e.key === "ArrowLeft") prev();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, prev]);

  // Scroll wheel hijacking
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      if (!(rect.top <= 100 && rect.bottom > window.innerHeight * 0.5)) return;
      if (isScrollingRef.current) return;
      if (hasCompletedCycleRef.current) return;

      e.preventDefault();
      isScrollingRef.current = true;

      if (e.deltaY > 0) {
        next();
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (current > 0) {
        prev();
      }

      setTimeout(() => {
        isScrollingRef.current = false;
      }, 200);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [current, next, prev]);

  const slide = slides[current];

  return (
    <section
      id="story"
      ref={sectionRef}
      className="flex items-center relative overflow-hidden"
      style={{ background: "#F5F2EB", scrollMarginTop: 56, minHeight: "calc(100vh - 56px)" }}
    >
      {/* Left arrow */}
      <button
        onClick={prev}
        className={`${styles["story-nav-btn"]} absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 cursor-pointer`}
      >
        <svg
          className="w-12 h-12 md:w-16 md:h-16 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Right arrow */}
      <button
        onClick={next}
        className={`${styles["story-nav-btn"]} absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 cursor-pointer`}
      >
        <svg
          className="w-12 h-12 md:w-16 md:h-16 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Transition overlay — section-level, persists across slide DOM changes */}
      {transitioning && (
        <div
          style={{
            position: "absolute", top: 24, right: 0, bottom: 0, left: 0, zIndex: 15,
            background: "#0B120D",
            animation: "storyTransition 0.4s ease-in-out forwards",
          }}
          onAnimationStart={() => {
            setTimeout(() => onTransitionMid(), 140);
          }}
          onAnimationEnd={() => setTransitioning(false)}
        />
      )}

      {/* Slide 1 — in-flow layout with side-by-side content */}
      {slide.id === 1 && (
        <div className="w-full relative z-10">
          <div key={slide.id} className={`${styles["story-slide"]} ${styles.active} w-full px-6 py-16`}>
            <div style={{ maxWidth: 1280, margin: "0 auto", paddingLeft: 48, paddingRight: 48 }}>
              <div style={{ display: "grid", alignItems: "start", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
                <div style={{ paddingTop: 60 }}>
                  <p className="mb-8" style={{ fontSize: 11, letterSpacing: ".28em", color: "rgba(30,42,34,.38)", opacity: .45, animation: "storyFadeUp 0.9s ease-out 0.3s both" }}>
                    {slide.englishTitle}
                  </p>
                  <div style={{ width: 48, height: 1, background: "rgba(0,0,0,.12)", marginBottom: 32 }} />
                  <h2 className="font-serif-cn mb-16" style={{ fontSize: 58, lineHeight: 1.08, fontWeight: 600, color: "#1E2A22", animation: "storyFadeUp 0.9s ease-out 0.5s both" }}>
                    {slide.chineseTitle}<br />
                    <span style={{ paddingLeft: "1.2em" }}>传承百年茶事</span>
                  </h2>
                  <div style={{ maxWidth: 460 }}>
                    {slide.lines.map((line, i) => (
                      <p key={i} className="mb-6" style={{ fontSize: 16, lineHeight: 2.1, color: "rgba(30,42,34,.72)", animation: "storyFadeUp 0.9s ease-out 0.8s both" }}>
                        {line}
                      </p>
                    ))}
                    {slide.extraLines?.map((line, i) => (
                      <p key={i} className={i === (slide.extraLines?.length ?? 0) - 1 ? "mb-20" : "mb-6"} style={{ fontSize: 16, lineHeight: 2.1, color: "rgba(30,42,34,.72)", animation: "storyFadeUp 0.9s ease-out 0.8s both" }}>
                        {line}
                      </p>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 56, paddingLeft: 24, animation: "storyFadeUp 0.9s ease-out 0.8s both" }}>
                    <div>
                      <div style={{ fontSize: 36, fontWeight: 600, color: "#243126", opacity: .88, marginBottom: 6 }}>100<span style={{ fontSize: 24, opacity: .55 }}>年</span></div>
                      <div style={{ fontSize: 12, letterSpacing: ".08em", color: "rgba(30,42,34,.48)" }}>制茶传承</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 36, fontWeight: 600, color: "#243126", opacity: .88, marginBottom: 6 }}>800<span style={{ fontSize: 24, opacity: .55 }}>m</span></div>
                      <div style={{ fontSize: 12, letterSpacing: ".08em", color: "rgba(30,42,34,.48)" }}>高山云雾</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 36, fontWeight: 600, color: "#243126", opacity: .88, marginBottom: 6 }}>20<span style={{ fontSize: 24, opacity: .55 }}>+</span></div>
                      <div style={{ fontSize: 12, letterSpacing: ".08em", color: "rgba(30,42,34,.48)" }}>古法工序</div>
                    </div>
                  </div>
                </div>
                <div className="relative overflow-visible" style={{ marginTop: 30, height: "65vh" }}>
                  <div style={{ borderRadius: "24px 36px 24px 24px", overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,.08)", transform: "translateX(40px)", position: "relative" }}>
                    <img src={slide.image} alt="茶园" className="w-full object-cover" style={{ filter: "saturate(.82) brightness(.97) contrast(1.03)", height: "65vh", transform: "scale(1.03)", animation: "storyBgIn 1.5s ease-out forwards" }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,0))" }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,244,228,.18), transparent 35%)" }} />
                    <div className="absolute bottom-6 right-8 text-white text-sm font-serif-en" style={{ letterSpacing: 2, opacity: 0.7 }}>
                      <span>0{slide.id}</span> / 06
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slides 2-6 — full-screen, positioned relative to section */}
      {slide.id !== 1 && (
        <div key={slide.id} className={`${styles["story-slide"]} ${styles.active} z-10`} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, paddingTop: 24 }}>
          <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#0B120D" }}>
            <img src={slide.image} alt={slide.chineseTitle}
              style={slide.id === 6
                ? { width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.03)", filter: "contrast(1.02) saturate(0.88) brightness(0.92)", animation: "storyBgIn 1.5s ease-out forwards" }
                : { width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.03)", animation: "storyBgIn 1.5s ease-out forwards" }}
            />
            <div className="absolute inset-0" style={{
              background: slide.id === 2
                ? "linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.55))"
                : slide.id === 3
                ? "radial-gradient(circle at center, rgba(0,0,0,0) 35%, rgba(10,15,12,0.45) 100%), linear-gradient(to bottom, rgba(255,220,180,0.12), rgba(255,255,255,0)), linear-gradient(to top, rgba(0,0,0,0.45), rgba(0,0,0,0))"
                : slide.id === 4
                ? "rgba(0,0,0,.25)"
                : slide.id === 5
                ? "linear-gradient(to right, rgba(255,200,150,0.2) 0%, rgba(255,255,255,0.03) 50%, rgba(10,30,55,0.3) 100%)"
                : "rgba(12,14,18,0.08), linear-gradient(90deg, rgba(188,198,192,0.10) 0%, rgba(120,135,128,0.08) 18%, rgba(42,58,66,0.20) 36%, rgba(78,72,58,0.10) 52%, rgba(122,90,54,0.16) 68%, rgba(150,160,175,0.08) 82%, rgba(190,200,215,0.12) 100%)"
            }} />
            {slide.id === 2 && <div className="water-shimmer absolute inset-0" />}
            {slide.id === 4 && (
              <div className="absolute inset-0" style={{
                background: "linear-gradient(to right, rgba(120,72,20,.25) 0%, rgba(255,255,255,.03) 50%, rgba(15,28,55,.35) 100%)"
              }} />
            )}
            {slide.id === 6 && (
              <div className="absolute inset-0" style={{
                background: "linear-gradient(90deg, rgba(8,10,12,.52) 0%, rgba(8,10,12,.38) 18%, rgba(8,10,12,.18) 34%, rgba(8,10,12,0) 52%)"
              }} />
            )}
            <div className="absolute bottom-0 left-0 text-white max-w-3xl" style={{ paddingLeft: 64, paddingRight: 32, paddingBottom: 64 }}>
              <p className="font-serif-en mb-2" style={slide.id === 3
                ? { fontSize: 13, letterSpacing: 4, color: "rgba(233,220,198,.62)", animation: "storyFadeUp 0.9s ease-out 0.3s both" }
                : { fontSize: 13, letterSpacing: 4, color: "rgba(228,220,205,.68)", animation: "storyFadeUp 0.9s ease-out 0.3s both" }}>
                {slide.englishTitle}
              </p>
              <h2 className="text-5xl md:text-6xl font-serif-cn font-bold mb-8"
                style={slide.id === 2 ? {
                  letterSpacing: "0.05em", lineHeight: 1.3,
                  background: "linear-gradient(180deg, #F4F1EA 0%, #D8D4CA 55%, #B9B7B1 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  textShadow: "0 2px 10px rgba(0,0,0,.28), 0 0 24px rgba(180,200,190,.04)",
                  animation: "storyFadeUp 0.9s ease-out 0.5s both",
                } : slide.id === 3 ? { letterSpacing: "0.05em", lineHeight: 1.3, color: "#F2E7D2", animation: "storyFadeUp 0.9s ease-out 0.5s both" }
                : slide.id === 4 ? { letterSpacing: "0.05em", lineHeight: 1.3, color: "rgba(255,244,228,.93)", animation: "storyFadeUp 0.9s ease-out 0.5s both" }
                : slide.id === 5 ? { letterSpacing: "0.05em", color: "rgba(255,245,228,.94)", lineHeight: 1.3, animation: "storyFadeUp 0.9s ease-out 0.5s both" }
                : { letterSpacing: "0.05em", color: "rgba(255,248,236,.96)", lineHeight: 1.3, animation: "storyFadeUp 0.9s ease-out 0.5s both" }
              }>
                {slide.chineseTitle}
              </h2>
              {slide.lines.map((line, i) => (
                <p key={i} className="text-base md:text-lg leading-relaxed mb-4" style={{ lineHeight: 1.9, color: "rgba(238,232,220,.82)", animation: "storyFadeUp 0.9s ease-out 0.8s both" }}>
                  {line}
                </p>
              ))}
              {slide.extraLines?.map((line, i) => (
                <p key={i} className="text-base md:text-lg leading-relaxed mb-8 font-serif-cn" style={{ letterSpacing: "0.05em", color: "rgba(238,232,220,.82)", animation: "storyFadeUp 0.9s ease-out 0.8s both" }}>
                  {line}
                </p>
              ))}
              <div className="text-sm font-serif-en" style={{ letterSpacing: 2, opacity: 0.7, animation: "storyFadeUp 0.9s ease-out 0.8s both" }}>
                <span>0{slide.id}</span> / 06
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
