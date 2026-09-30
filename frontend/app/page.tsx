"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Hero3D from "@/components/Hero3D";
import SupplyChain3D from "@/components/3d/SupplyChain3D";
import FederationNetwork3D from "@/components/3d/FederationNetwork3D";
import ForecastSurface3D from "@/components/3d/ForecastSurface3D";
import ImageCarousel from "@/components/ImageCarousel";
import { soundFx } from "@/lib/audio";
import {
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Network,
  ArrowRight,
  CheckCircle2,
  Lock,
  RefreshCw,
  BarChart3,
  Database,
  FileText,
  Sparkles,
  MapPin,
  Zap,
  Wifi,
  Activity,
  Layers,
  ChevronDown,
  Clock,
  Truck,
  Building2,
  TrendingUp,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/i18n";

// Count-up helper component
function AnimatedCounter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1600;
    const startTime = performance.now();

    const update = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setVal(Math.floor(ease * end));
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    requestAnimationFrame(update);
  }, [end]);

  return (
    <span>
      {prefix}
      {val}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  const { language } = useAppStore();
  const t = translations[language] || translations.en;

  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />

      {/* 1. HERO SECTION: SPATIAL 3D DIGITAL TWIN */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-16 max-w-7xl mx-auto w-full">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Pitch */}
          <div className="lg:col-span-6 space-y-6 z-10">
            {/* National Track Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold tracking-wider backdrop-blur-md shadow-glowCyan">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>BRICS RESILIENCE INITIATIVE • SMART HEALTH TRACK</span>
            </div>

            {/* Editorial Header */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-[1.08]">
              Zero preventable <br />
              <span className="shimmer-text">stock-outs.</span> <br />
              <span className="text-slate-200">Every health centre.</span> <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-500">
                Every state.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl font-normal">
              Autonomous multi-method demand forecasting, privacy-preserving BRICS edge federation, and mathematical MILP redistribution with human-in-the-loop clinical governance. Built for national scale.
            </p>

            {/* Tactical CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/district"
                onClick={() => soundFx.playAffirm()}
                className="group relative px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center gap-2.5 shadow-glowCyan transition-all hover:scale-[1.03] active:scale-[0.98] shimmer-border"
              >
                <Activity className="w-4 h-4 text-slate-950 animate-pulse" />
                <span>Launch Operational Console</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#narrative"
                onClick={() => soundFx.playClick()}
                className="px-6 py-3.5 rounded-xl glass-panel hover:bg-slate-800/90 text-white font-medium text-sm flex items-center gap-2 transition-all border border-slate-700/80 hover:border-cyan-500/50 hover:scale-[1.02]"
              >
                <span>Watch the Supply Flow</span>
                <ChevronDown className="w-4 h-4 text-cyan-400 animate-bounce" />
              </a>
            </div>

            {/* Proof Metric Counters */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/60">
                <p className="text-2xl sm:text-3xl font-bold font-display text-cyan-400">
                  <AnimatedCounter end={90} suffix="+" />
                </p>
                <p className="text-[11px] font-mono uppercase tracking-wide text-slate-400 mt-0.5">
                  PHC Network Seeded
                </p>
                <span className="text-[9px] font-mono text-emerald-400 block mt-1">● LIVE TELEMETRY</span>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/60">
                <p className="text-2xl sm:text-3xl font-bold font-display text-emerald-400">
                  <AnimatedCounter end={6} suffix=" States" />
                </p>
                <p className="text-[11px] font-mono uppercase tracking-wide text-slate-400 mt-0.5">
                  National Hierarchy
                </p>
                <span className="text-[9px] font-mono text-cyan-400 block mt-1">18 DISTRICTS</span>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/60">
                <p className="text-2xl sm:text-3xl font-bold font-display text-purple-400">
                  &le; 3.0 &epsilon;
                </p>
                <p className="text-[11px] font-mono uppercase tracking-wide text-slate-400 mt-0.5">
                  DP Privacy Budget
                </p>
                <span className="text-[9px] font-mono text-purple-300 block mt-1">&delta; = 10⁻⁵ OPACUS</span>
              </div>
            </div>
          </div>

          {/* Right 3D Spatial Digital Twin Hero Canvas */}
          <div className="lg:col-span-6">
            <Hero3D />
          </div>
        </div>
      </section>

      {/* 2. PUBLIC HEALTH FIELD DEPLOYMENT & HISTORICAL PROVENANCE */}
      <section className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-cyan-400">
                OPERATIONAL REALISM &amp; FIELD DEPLOYMENT
              </h2>
            </div>
            <p className="text-xl font-bold text-white mt-0.5">
              Primary Health Infrastructure &amp; Clinical Supply Operations
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 hidden sm:block bg-slate-900/80 px-3 py-1 rounded-md border border-slate-800">
            PROVENANCED: NHM • CMSS • NVBDCP
          </span>
        </div>
        <ImageCarousel />
      </section>

      {/* 3. NARRATIVE JOURNEY: THE SYSTEMIC CRISIS */}
      <section id="narrative" className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full border-t border-slate-800/70">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/30 uppercase tracking-widest">
            THE SYSTEMIC CRISIS
          </span>
          <h3 className="text-3xl sm:text-4xl font-display font-bold text-white mt-3">
            Why Rural Health Centers Run Out of Life-Saving Medicines
          </h3>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            Primary Health Centres (PHCs) and Community Health Centres (CHCs) face recurring stock-outs despite ample state reserves, caused by rigid indents, fragmented intelligence, and lack of inter-facility coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-rose-500/40 transition-all hover:translate-y-[-2px]">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Rigid Monthly Indents</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Paper indents are submitted on the 1st of every month without demand velocity adjustments. Sudden malaria or dengue surges exhaust local buffers within 72 hours while central replenishments take weeks.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all hover:translate-y-[-2px]">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
              <RefreshCw className="w-6 h-6 text-amber-400" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Simultaneous Surplus &amp; Deficit</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              While PHC Anakaputhur exhausts Artemether treatment packs, neighboring PHC Chromepet holds 200 surplus units expiring in 60 days with zero inter-facility transfer visibility or legal transport authorization.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all hover:translate-y-[-2px]">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
              <Wifi className="w-6 h-6 text-cyan-400" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Unreliable Field Connectivity</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Remote pharmacists operate in bandwidth-constrained rural locations. Traditional cloud-only SaaS dashboards fail completely during network blackouts, stranding inventory tracking.
            </p>
          </div>
        </div>
      </section>

      {/* 4. CLOSED-LOOP HIERARCHICAL SUPPLY CHAIN: 3D DIGITAL TWIN */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full border-t border-slate-800/70">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase tracking-widest">
            SPATIAL HIERARCHY
          </span>
          <h3 className="text-3xl font-display font-bold text-white mt-3">
            National-to-PHC Supply Chain Digital Twin
          </h3>
          <p className="text-slate-400 text-sm mt-2">
            Click any operational tier to inspect active inventory reserves, dispatch SLAs, and automated cold-chain monitoring.
          </p>
        </div>

        <SupplyChain3D />
      </section>

      {/* 5. HOW FORECASTING WORKS: 3D ANALYTICAL PROJECTION TERRAIN */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full border-t border-slate-800/70">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest">
              MULTI-HORIZON PREDICTION
            </span>
            <h3 className="text-3xl font-display font-bold text-white">
              Autonomous Demand Forecasting &amp; Poisson Risk
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              ResilHealth-India executes daily quantile regressions (LightGBM &amp; Vertex AI replica) computing 30-day forecast trajectories with &alpha; = 0.1 and &alpha; = 0.9 confidence bands.
            </p>

            <div className="space-y-3 pt-2 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-300">
                <span className="text-cyan-400 font-bold block mb-1">Poisson Survival Function:</span>
                <code>P(StockOut) = P(Demand &gt; EffectiveStock)</code>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  Explicitly calculates failure probability over a 14-day rolling window based on monsoon and vector outbreak indicators.
                </p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-300">
                <span className="text-emerald-400 font-bold block mb-1">Isolation Forest Anomaly Detection:</span>
                <code>Contamination Rate: 0.05 &bull; Surge Rejection Gate</code>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  Suppresses anomalous consumption spikes caused by duplicate logs or localized festival migrations.
                </p>
              </div>
            </div>

            <Link
              href="/forecast"
              className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold pt-2"
            >
              <span>Explore Forecast Lab &amp; Test Anomalies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="lg:col-span-7">
            <ForecastSurface3D facilityName="PHC Anakaputhur (Deficit Node)" currentStock={4} />
          </div>
        </div>
      </section>

      {/* 6. PRIVACY-PRESERVING BRICS FEDERATION: 3D MESH */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full border-t border-slate-800/70">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30 uppercase tracking-widest">
            CROSS-BORDER INTELLIGENCE
          </span>
          <h3 className="text-3xl font-display font-bold text-white mt-3">
            BRICS Federated Learning &amp; Differential Privacy
          </h3>
          <p className="text-slate-400 text-sm mt-2">
            Flower FedProx framework orchestrates edge model updates across India and Brazil nodes. Opacus DP-SGD guarantees zero patient data leakage.
          </p>
        </div>

        <FederationNetwork3D />
      </section>

      {/* 7. CLOSED-LOOP WORKFLOW STEPS */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full border-t border-slate-800/70 bg-slate-950/40 rounded-3xl">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase tracking-widest">
            EXECUTION PIPELINE
          </span>
          <h3 className="text-3xl font-display font-bold text-white mt-3">
            Six-Stage Closed Loop Resilience Workflow
          </h3>
          <p className="text-slate-400 text-sm mt-2">
            From offline field stock logging to mathematical optimization and legal DMO governance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            {
              step: "01",
              title: "Offline Stock Logging",
              desc: "Pharmacists log issues via speech-to-text or vision barcode scan with mandatory human confirmation.",
              tag: "IndexedDB PWA",
            },
            {
              step: "02",
              title: "Vector-Clock Sync",
              desc: "Automatic sync replay drains queued transactions with deterministic causality ordering and hash verification.",
              tag: "Idempotent Replay",
            },
            {
              step: "03",
              title: "Demand Forecasting",
              desc: "Vertex AI / Local LightGBM 30-day projection with alpha 0.1/0.9 uncertainty boundaries.",
              tag: "Quantile Loss",
            },
            {
              step: "04",
              title: "Poisson Risk Engine",
              desc: "Computes exact stock-out probability P(D > S) and triggers automatic redistribution thresholds.",
              tag: "Poisson SF",
            },
            {
              step: "05",
              title: "MILP Redistribution",
              desc: "PuLP integer optimization minimizes cost (INR 100+15/km) and travel ETA between surplus & deficit nodes.",
              tag: "PuLP / CBC",
            },
            {
              step: "06",
              title: "DMO Governance",
              desc: "District Medical Officer approval, FEFO batch allocation, electronic transport voucher, and SHA-256 audit.",
              tag: "Voucher SLA",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xl font-extrabold text-cyan-400/60">{item.step}</span>
                <h5 className="font-bold text-sm text-white mt-1 mb-1.5">{item.title}</h5>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
              <span className="mt-3 inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 w-fit">
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 8. CALL TO ACTION: MISSION READY COMMAND CONSOLE */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 max-w-7xl mx-auto w-full text-center relative">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 via-emerald-500 to-blue-600 p-[1.5px] mx-auto shadow-glowCyan">
            <div className="w-full h-full bg-[#050B1A] rounded-[14px] flex items-center justify-center">
              <Activity className="w-8 h-8 text-cyan-400 animate-pulseSlow" />
            </div>
          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white">
            Operationalize National Health Resilience
          </h2>
          <p className="text-slate-300 text-base max-w-xl mx-auto leading-relaxed">
            Experience the production-ready command platform connecting 90+ facilities across 6 states with verified clinical governance.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/district"
              onClick={() => soundFx.playAffirm()}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-glowCyan transition-all hover:scale-105"
            >
              Enter District Command Center
            </Link>

            <Link
              href="/national"
              onClick={() => soundFx.playClick()}
              className="px-8 py-4 rounded-xl glass-panel hover:bg-slate-800 text-white font-medium text-sm border border-slate-700 hover:border-cyan-500/40 transition-all hover:scale-105"
            >
              Explore National 3D GIS
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#020611] px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center border border-cyan-500/40">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="font-bold font-display text-white">ResilHealth-India</span>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              Federated National Health Resource &amp; Supply Chain Resilience Platform. Track: Smart Health &amp; Supply Chain Resilience &mdash; BRICS Resilience Initiative.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <Link href="/district" className="hover:text-white transition-colors">District Console</Link>
            <Link href="/facility" className="hover:text-white transition-colors">Facility Console</Link>
            <Link href="/national" className="hover:text-white transition-colors">National GIS</Link>
            <Link href="/forecast" className="hover:text-white transition-colors">Forecast Lab</Link>
            <Link href="/federation" className="hover:text-white transition-colors">Federated Center</Link>
            <Link href="/copilot" className="hover:text-white transition-colors">Copilot</Link>
            <Link href="/audit" className="hover:text-white transition-colors">Audit Trail</Link>
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">Portal Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
