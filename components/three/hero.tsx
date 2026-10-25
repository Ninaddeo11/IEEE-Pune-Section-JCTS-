"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useState, useRef, type ReactNode } from "react";
const Scene = dynamic(() => import("./hero-scene"), { ssr: false });
class Boundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}
export default function Hero3D() {
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(true);
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setActive(entry.isIntersecting),
    );
    if (element.current) observer.observe(element.current);
    const visibility = () =>
      setActive(
        !document.hidden &&
          Boolean(
            element.current &&
            element.current.getBoundingClientRect().bottom > 0,
          ),
      );
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 760px)")
        .matches
    )
      return;
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2");
      if (gl) {
        requestAnimationFrame(() => setEnabled(true));
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
    } catch {}
  }, []);
  return (
    <div className="hero-visual" ref={element} aria-hidden="true">
      <div className="hero-halo" />
      <div className="fallback-system">
        <span />
        <span />
        <span />
        <span />
        <i />
      </div>
      {enabled && (
        <div className="webgl-scene">
          <Boundary>
            <Scene active={active} />
          </Boundary>
        </div>
      )}
      <span className="visual-coordinate coord-top">
        SYS. 01 / INTERCONNECTED
      </span>
      <span className="visual-coordinate coord-bottom">
        18.5204° N &nbsp; 73.8567° E
      </span>
      <div className="visual-caption">
        <span className="pulse-dot" /> CONNECTED SYSTEMS. SHARED POSSIBILITIES.
      </div>
    </div>
  );
}
