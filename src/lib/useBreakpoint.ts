"use client";

import { useState, useEffect } from "react";

const BREAKPOINT = 768;

export function useBreakpoint() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth <= BREAKPOINT);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return { isMobile };
}
