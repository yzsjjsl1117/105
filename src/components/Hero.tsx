"use client";

import { useEffect, useRef } from "react";
import styles from "./Hero.module.css";

export default function Hero() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (bgRef.current && window.scrollY < window.innerHeight) {
        bgRef.current.style.transform = `translateY(${window.scrollY * 0.5}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section id="home" className={`${styles.hero} h-screen flex items-center`}>
      {/* 背景图 */}
      <div ref={bgRef} className="absolute inset-0">
        <img
          src="/images/hero-bg.png"
          alt="黄山茶园"
          className="w-full h-full object-cover"
        />
      </div>

      {/* 文字内容 */}
      <div className={styles["hero-content"]}>
        <div className={styles["hero-subtitle"]}>MIST · MOUNTAIN · TEA</div>

        <h1 className={styles["hero-title"]}>
          山水养好茶<br />
          <span style={{ display: "inline-block", marginLeft: "1.5em", whiteSpace: "nowrap" }}>
            一叶知匠心
          </span>
        </h1>

        <a href="#story" className={styles["hero-link"]} style={{ marginTop: "-20px" }}>
          开启山中茶事
        </a>
      </div>

    </section>
  );
}
