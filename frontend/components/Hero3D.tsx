"use client";

import React, { useState } from "react";
import India3DMap from "./3d/India3DMap";
import { FacilityNode3D } from "./3d/indiaData";
import { Activity, ShieldCheck, ArrowRight, Zap, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function Hero3D() {
  const [selectedFacility, setSelectedFacility] = useState<FacilityNode3D | null>(null);

  return (
    <div className="relative w-full h-[580px] lg:h-[680px]">
      {/* 3D Master India Digital Twin Canvas */}
      <India3DMap
        heightClass="h-full"
        showHUD={true}
        onSelectFacility={(fac) => setSelectedFacility(fac)}
      />

      {/* Floating Tactical Callout (Active Kanchipuram Demonstration Link) */}
      <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2">
        <Link
          href="/district"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold backdrop-blur-md shadow-glowCyan transition-all hover:scale-105"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Inspect Active Kanchipuram Deficit</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>
    </div>
  );
}
