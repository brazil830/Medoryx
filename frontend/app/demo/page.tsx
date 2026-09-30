"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import {
  Sliders, AlertTriangle, RefreshCw, Wifi, WifiOff, CheckCircle2,
  Activity, Cpu, ShieldCheck, Database, Zap, Lock, AlertCircle
} from "lucide-react";

export default function DemoControlPage() {
  const { user, token, isOffline, setIsOffline } = useAppStore();

  const [demoStatus, setDemoStatus] = useState<any | null>(null);
  const [healthData, setHealthData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const d = await api.getDemoStatus(token);
      setDemoStatus(d);
      const h = await api.getSystemHealth();
      setHealthData(h);
    } catch (err) {
      console.error("Demo status error:", err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [token]);

  const handleTriggerScenario = async (scenario: string, outbreak: boolean) => {
    setLoading(true);
    setNotice(null);
    try {
      await api.triggerScenario({
        scenario,
        outbreak_spike_active: outbreak,
        offline_mode: isOffline,
      }, token);
      setNotice(`Scenario updated to: ${scenario} (Outbreak Surge=${outbreak ? "ACTIVE" : "INACTIVE"})`);
      await loadStatus();
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setNotice(null);
    try {
      await api.resetBaseline(token);
      setIsOffline(false);
      setNotice("Database and scenario fully restored to deterministic Seed 42 baseline!");
      await loadStatus();
    } catch (err: any) {
      setNotice(`Reset error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col pb-16">
      <Navbar />

      {/* Demo Warning Banner (Part AT) */}
      <div className="bg-amber-950/80 border-b border-amber-500/40 text-amber-200 px-4 py-2.5 text-xs text-center font-bold tracking-wider uppercase flex items-center justify-center gap-2">
        <Sliders className="w-4 h-4 text-amber-400" />
        <span>DEMO ENVIRONMENT CONTROL • Authorized Evaluator Sandbox (DEMO_MODE=true)</span>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 flex-1">
        
        {/* Notice Feedback */}
        {notice && (
          <div className="p-4 bg-cyan-950/80 border border-cyan-500/50 rounded-2xl text-cyan-200 text-xs flex items-center gap-2 shadow-glowCyan">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Section 1: Scenario Presets */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">Deterministic Demo Presets</h2>
              <p className="text-xs text-slate-400">Trigger multi-step acceptance scenarios instantly without manual database manipulation</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">
              ACTIVE: {demoStatus?.active_scenario || "BASELINE"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleTriggerScenario("BASELINE", false)}
              disabled={loading}
              className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-emerald-400">1. BASELINE</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                All 5 Kanchipuram facilities GREEN. Normal consumption rates (10 packs/d). Zero deficit.
              </p>
            </button>

            <button
              onClick={() => handleTriggerScenario("MALARIA_SURGE", true)}
              disabled={loading}
              className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 text-left transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-rose-400">2. MALARIA SURGE</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                300% demand surge at Anakaputhur (d=40/day). Poisson risk jumps to 99% (RED).
              </p>
            </button>

            <button
              onClick={() => {
                setIsOffline(true);
                handleTriggerScenario("OFFLINE_SYNC", true);
              }}
              disabled={loading}
              className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-amber-400">3. OFFLINE SYNC</span>
                <WifiOff className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Disconnects network. Pharmacist logs 30 voice + 55 vision packs into IndexedDB queue.
              </p>
            </button>

            <button
              onClick={() => handleTriggerScenario("EXPIRY_REBALANCING", false)}
              disabled={loading}
              className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-cyan-400">4. EXPIRY REBALANCE</span>
                <RefreshCw className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Detects 20 units of Batch B240715 near expiry (60 days) at Chromepet for FEFO priority.
              </p>
            </button>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-800">
            <span className="text-xs text-slate-400">Need a fresh start?</span>
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Full Reset to Seed 42 Baseline</span>
            </button>
          </div>
        </div>

        {/* Section 2: Service Health Diagnostics (Part AW) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">Operational Service Health &amp; Adapters</h2>
              <p className="text-xs text-slate-400">Real-time status of backend engines, database persistence, and Google AI services</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              SYSTEM OPERATIONAL
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthData?.services?.map((svc: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{svc.service}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    svc.status === "CONNECTED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                    svc.status === "FALLBACK" ? "bg-amber-500/10 text-amber-300 border-amber-500/30" :
                    "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  }`}>
                    {svc.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{svc.notes}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>Latency: {svc.latency_ms} ms</span>
                  <span>Validated IST</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
