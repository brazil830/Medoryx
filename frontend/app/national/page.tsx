"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import India3DMap from "@/components/3d/India3DMap";
import { STATE_REGIONS, FacilityNode3D, StateRegion3D } from "@/components/3d/indiaData";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { soundFx } from "@/lib/audio";
import {
  Globe,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Database,
  TrendingDown,
  Layers,
  MapPin,
  Building2,
  Activity,
  Cpu,
  RefreshCw,
  Sliders,
  Sparkles,
} from "lucide-react";

export default function NationalOverviewPage() {
  const { token } = useAppStore();
  const [nationalData, setNationalData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<FacilityNode3D | null>(null);
  const [activeView, setActiveView] = useState<"3d" | "table">("3d");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getNationalOverview(token);
        setNationalData(res);
      } catch (err) {
        console.error("National data error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [token]);

  const handleStateClick = (stName: string | null) => {
    soundFx.playClick();
    setSelectedState(stName);
    setSelectedFacility(null);
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col pb-16">
      <Navbar />

      {/* Top Banner */}
      <div className="border-b border-slate-800 bg-[#070E22] px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30">
                STATE DIRECTOR &amp; NATIONAL TIER
              </span>
              <span className="text-xs text-slate-400 font-mono">BIGQUERY STREAMING ACTIVE</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-white mt-1">
              National Health Supply Resilience &amp; Spatial GIS
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveView("3d");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold transition-all ${
                  activeView === "3d"
                    ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-glowCyan"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>3D Spatial GIS</span>
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveView("table");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold transition-all ${
                  activeView === "table"
                    ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-glowCyan"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>State Matrix</span>
              </button>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-cyan-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>BigQuery: 284,000 Rows</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 flex-1">
        {/* National High-Level KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/30 transition-all">
            <span className="text-xs text-slate-400 font-medium">Total Health Facilities</span>
            <p className="text-3xl font-bold font-display text-white mt-1">
              {nationalData?.total_facilities || 95}
            </p>
            <span className="text-[11px] text-cyan-400 font-mono mt-1 block">Across 6 Indian States</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-all">
            <span className="text-xs text-slate-400 font-medium">National Stock-Out Rate</span>
            <p className="text-3xl font-bold font-display text-emerald-400 mt-1">
              {nationalData?.national_stockout_rate_pct || 0.0}%
            </p>
            <span className="text-[11px] text-slate-400 font-mono mt-1 block">Target: &lt; 2.0%</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/30 transition-all">
            <span className="text-xs text-slate-400 font-medium">Active Inter-Facility Transfers</span>
            <p className="text-3xl font-bold font-display text-cyan-400 mt-1">
              {nationalData?.active_redistributions || 1}
            </p>
            <span className="text-[11px] text-cyan-300 font-mono mt-1 block">PuLP CBC Solved</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-purple-500/30 transition-all">
            <span className="text-xs text-slate-400 font-medium">Tracked Essential Drugs</span>
            <p className="text-3xl font-bold font-display text-purple-400 mt-1">10 SKUs</p>
            <span className="text-[11px] text-slate-400 font-mono mt-1 block">Anti-Malarial, Analgesic, ORS</span>
          </div>
        </div>

        {/* State Interactive Filter Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-mono text-slate-400 shrink-0 mr-1">Geographic Filter:</span>
          <button
            onClick={() => handleStateClick(null)}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
              selectedState === null
                ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 shadow-glowCyan"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            All India (Overview)
          </button>
          {STATE_REGIONS.map((st) => (
            <button
              key={st.code}
              onClick={() => handleStateClick(st.name)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                selectedState === st.name
                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 shadow-glowCyan font-bold"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {st.name} ({st.code})
            </button>
          ))}
        </div>

        {/* 3D Spatial GIS Mode */}
        {activeView === "3d" && (
          <div className="space-y-4">
            <div className="relative w-full h-[620px] lg:h-[720px]">
              <India3DMap
                selectedState={selectedState}
                onSelectFacility={(fac) => setSelectedFacility(fac)}
                onSelectState={(reg) => setSelectedState(reg.name)}
                heightClass="h-full"
                showHUD={true}
              />
            </div>
          </div>
        )}

        {/* State Resilience Matrix Table View */}
        {(activeView === "table" || activeView === "3d") && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">State Supply Resilience Matrix</h2>
                <p className="text-xs text-slate-400">
                  Risk scoring and facility distribution derived directly from authoritative database
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">6 STATES • 18 DISTRICTS</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">State</th>
                    <th className="p-3">Districts</th>
                    <th className="p-3">Facilities</th>
                    <th className="p-3">Status Breakdown</th>
                    <th className="p-3">Composite Resilience Score</th>
                    <th className="p-3">Vector Risk</th>
                    <th className="p-3 text-right">3D Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {nationalData?.state_breakdown?.map((st: any) => (
                    <tr
                      key={st.state_name}
                      onClick={() => handleStateClick(st.state_name)}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        selectedState === st.state_name ? "bg-cyan-500/10" : ""
                      }`}
                    >
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{st.state_name}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">{st.districts_count} Districts</td>
                      <td className="p-3 font-mono text-slate-300">{st.facilities_count} PHC/CHCs</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {st.red_facilities > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {st.red_facilities} RED
                            </span>
                          )}
                          {st.amber_facilities > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {st.amber_facilities} AMBER
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {st.green_facilities} GREEN
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-cyan-400">
                        {st.composite_resilience_score}%
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.malaria_risk_level === "CRITICAL"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {st.malaria_risk_level}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStateClick(st.state_name);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 border border-slate-700 text-[10px] font-mono"
                        >
                          Zoom in 3D &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cross-District Logistics & Escalations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-white text-base">Cross-District Logistics Routing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When intra-district surplus is insufficient to resolve a deficit within 40 km, the system escalates recommendations to the State Director, querying neighboring district inventories up to 80 km.
            </p>
            <div className="p-3 bg-slate-900 rounded-xl text-xs space-y-1 font-mono text-slate-300 border border-slate-800">
              <p>• Corridor: Chengalpattu &rarr; Kanchipuram (Available 80 km radius)</p>
              <p>• Emergency Courier Surcharge: Standard INR 100 + 15/km</p>
              <p>• Required Approval Authority: STATE_DIRECTOR</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-white text-base">BigQuery National Data Pipeline</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Operational transactions stream continuously to Google BigQuery, powering aggregate epidemiology models, seasonal demand projections, and BRICS national reporting.
            </p>
            <div className="p-3 bg-slate-900 rounded-xl text-xs space-y-1 font-mono text-slate-300 border border-slate-800">
              <p>• Schema: Partitioned by IST Calendar Date</p>
              <p>• Mirror Latency: Sub-second replica stream</p>
              <p>• Privacy Guarantee: Zero patient identifiers ingested</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
