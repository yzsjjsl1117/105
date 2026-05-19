"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Step {
  num: string;
  name: string;
  desc: string;
  color: string;
  image: string;
  imageClass?: string;
}

const steps: Step[] = [
  { num: "壹", name: "采青", desc: "晨露未散，\n只取一芽一叶。", color: "#6A8B5E", image: "/images/采青.png" },
  { num: "贰", name: "萎凋", desc: "竹匾轻摊，\n散去青涩草气。", color: "#9B8662", image: "/images/萎凋.png", imageClass: "process-image-weidiao" },
  { num: "叁", name: "杀青", desc: "高温定香，\n锁住山野清气。", color: "#4A4A42", image: "/images/杀青.png", imageClass: "process-image-shaqing" },
  { num: "肆", name: "揉捻", desc: "茶叶成形，\n茶汁缓缓溢出。", color: "#705844", image: "/images/揉捻.png", imageClass: "process-image-rounian" },
  { num: "伍", name: "焙香", desc: "文火慢焙，\n余韵渐成。", color: "#B08A4A", image: "/images/焙香.png", imageClass: "process-image-beixiang" },
];

export default function CraftProcess() {
  const [activeStep, setActiveStep] = useState(1);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  const updatePositions = useCallback(() => {
    const container = stepsContainerRef.current;
    if (!container) return;

    // Update indicator position
    if (indicatorRef.current) {
      const activeEl = container.querySelector(`[data-step="${activeStep}"] .step-number`) as HTMLElement;
      if (activeEl) {
        const containerRect = container.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();
        indicatorRef.current.style.top = `${elRect.top - containerRect.top}px`;
      }
    }

    // Update timeline position (spans from first to last step number)
    if (timelineRef.current && steps.length > 0) {
      const firstNumber = container.querySelector(`[data-step="1"] .step-number`) as HTMLElement;
      const lastNumber = container.querySelector(`[data-step="${steps.length}"] .step-number`) as HTMLElement;
      if (firstNumber && lastNumber) {
        const containerRect = container.getBoundingClientRect();
        const topPos = firstNumber.getBoundingClientRect().top - containerRect.top;
        const bottomPos = lastNumber.getBoundingClientRect().bottom - containerRect.top;
        timelineRef.current.style.top = `${topPos}px`;
        timelineRef.current.style.height = `${bottomPos - topPos}px`;
      }
    }
  }, [activeStep]);

  useEffect(() => {
    updatePositions();
    // Recalculate on resize
    window.addEventListener("resize", updatePositions);
    return () => window.removeEventListener("resize", updatePositions);
  }, [updatePositions]);

  return (
    <section
      id="craft"
      className="flex items-center"
      style={{
        background: "#F3EEE6",
        backgroundImage: "radial-gradient(circle at center, rgba(120,140,120,.03), transparent 60%)",
        minHeight: "100vh",
        paddingTop: 100,
        paddingBottom: 40,
      }}
    >
      <div className="w-full" style={{ maxWidth: 1280, margin: "0 auto", paddingLeft: 80, paddingRight: 80 }}>
        {/* 标题 */}
        <div className="mb-8">
          <p className="font-serif-en mb-2" style={{ fontSize: 12, letterSpacing: 4, color: "#B89B67", textTransform: "uppercase" }}>
            THE ART OF MOUNTAIN TEA
          </p>
          <h2 className="font-serif-cn" style={{ fontSize: 38, fontWeight: 500, color: "#243428", lineHeight: 1.3 }}>
            五道古法<br />
            <span style={{ display: "inline-block", marginLeft: 60 }}>炼成一叶山韵</span>
          </h2>
        </div>

        <div style={{ position: "relative" }}>
          <div className="grid gap-12" style={{ gridTemplateColumns: "38% 62%" }}>
            {/* 左侧步骤列表 */}
            <div ref={stepsContainerRef} style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative", paddingLeft: 24, height: 500 }}>
              {/* 背景时间线 */}
              <div ref={timelineRef}
                style={{
                  position: "absolute", left: 0, top: 0,
                  width: 1, height: 0,
                  background: "rgba(0,0,0,0.08)",
                }}
              />
              {/* 当前步骤指示器 */}
              <div ref={indicatorRef}
                style={{
                  position: "absolute", left: -1, top: 0,
                  width: 2, height: 60,
                  background: steps[activeStep - 1].color,
                  transition: "top 0.5s ease, background 0.5s ease",
                }}
              />
              {steps.map((step, i) => (
                <div
                  key={i}
                  data-step={i + 1}
                  className={`craft-step ${activeStep === i + 1 ? "active" : ""}`}
                  onMouseEnter={() => setActiveStep(i + 1)}
                >
                  <h3 className="font-serif-cn craft-step-title" style={{ fontSize: 22, fontWeight: 500, color: step.color, marginBottom: 4 }}>
                    <span className="step-number craft-step-number" style={{ transition: "all 0.3s ease", width: 28, display: "inline-block" }}>
                      {step.num}
                    </span>
                    <span className="step-separator" style={{ transition: "opacity 0.3s ease", margin: "0 6px" }}>·</span>
                    <span className="step-name" style={{ transition: "all 0.3s ease", display: "inline-block" }}>
                      {step.name}
                    </span>
                  </h3>
                  <p className="craft-step-desc" style={{
                    fontSize: 14, lineHeight: 1.9, color: step.color,
                    opacity: activeStep === i + 1 ? 0.75 : 0,
                    maxHeight: activeStep === i + 1 ? "100px" : 0,
                    marginTop: 2,
                    marginBottom: 0,
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                  }}>
                    {step.desc.split("\n").map((line, j) => (
                      <span key={j}>{line}<br /></span>
                    ))}
                  </p>
                </div>
              ))}
            </div>

            {/* 右侧图片 */}
            <div style={{ position: "absolute", right: "1.5rem", top: -150, width: "calc(62% - 1.5rem)", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "100%", maxWidth: 560 }}>
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/5", borderRadius: 18 }}>
                  {steps.map((step, i) => (
                    <div
                      key={i}
                      data-step={i + 1}
                      className={`process-image absolute inset-0`}
                      style={{ opacity: activeStep === i + 1 ? 1 : 0, transition: "opacity 1s ease" }}
                    >
                      <img src={step.image} alt={step.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
