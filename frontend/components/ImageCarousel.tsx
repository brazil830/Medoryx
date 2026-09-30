"use client";

import React, { useState, useEffect } from "react";
import { CAROUSEL_SLIDES } from "@/lib/images";
import { ShieldCheck, Truck, Stethoscope, Building2, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export default function ImageCarousel() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const slide = CAROUSEL_SLIDES[currentIdx];

  const icons = [Building2, Stethoscope, ShieldCheck, Truck, ShieldCheck];
  const IconComponent = icons[currentIdx % icons.length];

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden glass-panel border border-slate-800 transition-all shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Graphic Simulation with Ken Burns Animation */}
      <div className={`w-full h-80 sm:h-96 bg-gradient-to-br ${slide.accent} relative flex items-center justify-center p-8 overflow-hidden`}>
        {/* Subtle grid and glowing radial ring */}
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none animate-pulseSlow" />

        {/* Center Operational Badge Visual */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl px-4 animate-float">
          <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-cyan-500/40 flex items-center justify-center mb-4 shadow-glowCyan">
            <IconComponent className="w-8 h-8 text-cyan-400" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 uppercase mb-2">
            {slide.tag}
          </span>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-white mb-2 leading-tight">
            {slide.title}
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed mb-3">
            {slide.caption}
          </p>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-md border border-slate-800">
            <span>PROVENANCE:</span>
            <span className="text-cyan-400">{slide.source}</span>
          </div>
        </div>
      </div>

      {/* Slide Navigation Bar */}
      <div className="absolute bottom-4 left-0 right-0 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          {CAROUSEL_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIdx ? "w-8 bg-cyan-400 shadow-glowCyan" : "w-2 bg-slate-700 hover:bg-slate-500"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            title={isPaused ? "Play slide rotation" : "Pause slide rotation"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setCurrentIdx((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentIdx((prev) => (prev + 1) % CAROUSEL_SLIDES.length)}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
