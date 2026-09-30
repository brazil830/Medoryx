"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import {
  MapPin, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Truck,
  Clock, IndianRupee, RefreshCw, XCircle, Check, Sliders, Info, Sparkles, AlertCircle
} from "lucide-react";

import District3DScene from "@/components/3d/District3DScene";
import { soundFx } from "@/lib/audio";

export default function DistrictConsolePage() {
  const { user, token, activeDistrict, isOffline } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"map" | "recommendations" | "capacity">("map");
  const [mapMode, setMapMode] = useState<"3d" | "2d">("3d");

  // Approval / Adjustment / Rejection Modal State
  const [selectedRec, setSelectedRec] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"approve" | "adjust" | "reject" | null>(null);
  const [adjustedQty, setAdjustedQty] = useState<number>(120);
  const [rejectReason, setRejectReason] = useState<string>("INSUFFICIENT_TRANSPORT");

  const [rejectNotes, setRejectNotes] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch facilities and recommendations for Kanchipuram
  const loadData = async () => {
    setLoading(true);
    try {
      // Load all 5 facilities in Kanchipuram
      const facIds = ["FAC-TN-KAN-001", "FAC-TN-KAN-002", "FAC-TN-KAN-003", "FAC-TN-KAN-004", "FAC-TN-KAN-005"];
      const facPromises = facIds.map((id) => api.getFacilityInventory(id, token).catch(() => null));
      const facResults = await Promise.all(facPromises);
      const validFacs = facResults.filter((r) => r !== null).map((r) => r.facility);
      setFacilities(validFacs);

      if (validFacs.length > 0 && !selectedFacility) {
        setSelectedFacility(facResults[0]);
      }

      // Load recommendations
      const recRes = await api.getRecommendations(activeDistrict, undefined, token);
      setRecommendations(recRes?.recommendations || []);
    } catch (err) {
      console.error("Failed to load district data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [activeDistrict, token]);

  // Run MILP Redistribution Optimization
  const handleRunOptimization = async () => {
    setLoading(true);
    try {
      await api.runRedistribution(activeDistrict, "DRUG-AL-01", token);
      await loadData();
    } catch (err: any) {
      alert(`Optimization error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Execute State Machine Transitions
  const handleConfirmAction = async () => {
    if (!selectedRec) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (actionType === "approve") {
        const res = await api.approveRecommendation(selectedRec.id, null, token);
        setActionSuccess(`Approved! Voucher ID: ${res.voucher_id} generated.`);
      } else if (actionType === "adjust") {
        const res = await api.approveRecommendation(selectedRec.id, adjustedQty, token);
        setActionSuccess(`Quantity adjusted to ${adjustedQty} and approved! Voucher ID: ${res.voucher_id}`);
      } else if (actionType === "reject") {
        await api.rejectRecommendation(selectedRec.id, rejectReason, rejectNotes || null, token);
        setActionSuccess(`Recommendation rejected with reason: ${rejectReason}`);
      }
      setTimeout(async () => {
        setActionType(null);
        setSelectedRec(null);
        await loadData();
      }, 1500);
    } catch (err: any) {
      setActionError(err.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      <Navbar />

      {/* District Header Bar */}
      <div className="border-b border-slate-800 bg-[#070E22] px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                DISTRICT: {activeDistrict.toUpperCase()} (TAMIL NADU)
              </span>
              <span className="text-xs text-slate-400 font-mono">CODE: DIS-TN-KAN</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-white mt-1">
              District Medical Officer (DMO) Command Console
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunOptimization}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-glowCyan disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Run MILP Optimization</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6">
          <button
            onClick={() => setActiveTab("map")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "map"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glowCyan"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            GIS District Risk Map
          </button>
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "recommendations"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glowCyan"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <span>Transfer Recommendations</span>
            {recommendations.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
                {recommendations.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: GIS DISTRICT RISK MAP */}
        {activeTab === "map" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Map Canvas Visualizer */}
            <div className="lg:col-span-8 glass-panel p-4 rounded-2xl border border-slate-800 relative flex flex-col justify-between min-h-[500px]">
              
              {/* Map Canvas Header */}
              <div className="flex items-center justify-between z-10 mb-2">
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white">Spatial Operations • Kanchipuram Block</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-[11px] font-mono">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setMapMode("3d");
                      }}
                      className={`px-2 py-0.5 rounded font-semibold transition-all ${
                        mapMode === "3d"
                          ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-glowCyan"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      3D Room
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setMapMode("2d");
                      }}
                      className={`px-2 py-0.5 rounded font-semibold transition-all ${
                        mapMode === "2d"
                          ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-glowCyan"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      2D Grid
                    </button>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                    <span>OUTBREAK INDEX:</span>
                    <span className="text-amber-400 font-bold">3.5</span>
                  </div>
                </div>
              </div>

              {/* 3D District Operations Scene or 2D Schematic */}
              {mapMode === "3d" ? (
                <District3DScene
                  onSelectFacility={(facId) => {
                    const found = facilities.find((f) => f.id === facId);
                    if (found) {
                      setSelectedFacility({ facility: found });
                    }
                  }}
                  activeRecommendation={recommendations.length > 0}
                />
              ) : (
                /* Interactive Vector GIS Simulation */
                <div className="relative w-full h-96 bg-[#040814] rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-6">
                  {/* Background GIS Grid with Road Corridors */}
                  <div className="absolute inset-0 grid-bg opacity-30" />
                  <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-800 stroke-[1.5] fill-none">
                    <line x1="28%" y1="35%" x2="52%" y2="48%" strokeDasharray="4 4" stroke="#06b6d4" strokeWidth="2" className="animate-pulseSlow" />
                    <line x1="52%" y1="48%" x2="70%" y2="60%" />
                    <line x1="28%" y1="35%" x2="35%" y2="70%" />
                    <line x1="52%" y1="48%" x2="35%" y2="70%" />
                  </svg>

                  {/* 1. Anakaputhur */}
                  <div
                    onClick={() => setSelectedFacility({
                      facility: {
                        id: "FAC-TN-KAN-001",
                        code: "PHC-Anakaputhur",
                        name: "PHC Anakaputhur",
                        overall_status: facilities.find((f) => f.code === "PHC-Anakaputhur")?.overall_status || "RED",
                      }
                    })}
                    className="absolute cursor-pointer transition-transform hover:scale-110 flex flex-col items-center group"
                    style={{ top: "32%", left: "26%" }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      facilities.find((f) => f.code === "PHC-Anakaputhur")?.overall_status === "RED"
                        ? "bg-rose-950 border-rose-500 shadow-glowRed animate-pulse"
                        : "bg-emerald-950 border-emerald-500"
                    }`}>
                      <AlertTriangle className={`w-4 h-4 ${
                        facilities.find((f) => f.code === "PHC-Anakaputhur")?.overall_status === "RED" ? "text-rose-400" : "text-emerald-400"
                      }`} />
                    </div>
                    <span className="text-[10px] font-bold text-white mt-1 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700">
                      PHC Anakaputhur
                    </span>
                    <span className="text-[9px] font-mono text-rose-400">
                      {facilities.find((f) => f.code === "PHC-Anakaputhur")?.overall_status === "RED" ? "4.1d Stock-out Risk" : "Normal Stock"}
                    </span>
                  </div>

                  {/* 2. Chromepet */}
                  <div
                    onClick={() => setSelectedFacility({
                      facility: {
                        id: "FAC-TN-KAN-002",
                        code: "PHC-Chromepet",
                        name: "PHC Chromepet",
                        overall_status: "GREEN",
                      }
                    })}
                    className="absolute cursor-pointer transition-transform hover:scale-110 flex flex-col items-center group"
                    style={{ top: "45%", left: "52%" }}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-950 border-2 border-emerald-500 shadow-glowGreen flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-bold text-white mt-1 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700">
                      PHC Chromepet
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400">+200 Units Surplus</span>
                  </div>

                  {/* 3. Pallavaram */}
                  <div className="absolute cursor-pointer transition-transform hover:scale-110 flex flex-col items-center" style={{ top: "25%", left: "65%" }}>
                    <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[10px] text-slate-300 mt-1">PHC Pallavaram</span>
                  </div>

                  {/* 4. Tambaram */}
                  <div className="absolute cursor-pointer transition-transform hover:scale-110 flex flex-col items-center" style={{ top: "68%", left: "33%" }}>
                    <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[10px] text-slate-300 mt-1">PHC Tambaram</span>
                  </div>

                  {/* 5. Sriperumbudur */}
                  <div className="absolute cursor-pointer transition-transform hover:scale-110 flex flex-col items-center" style={{ top: "60%", left: "70%" }}>
                    <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[10px] text-slate-300 mt-1">PHC Sriperumbudur</span>
                  </div>

                  {/* Active Transfer Corridor Legend Badge */}
                  <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-cyan-500/30 rounded-lg p-2 text-xs flex items-center gap-2">
                    <Truck className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <div>
                      <p className="font-bold text-white text-[11px]">Recommended Route: Chromepet &rarr; Anakaputhur</p>
                      <p className="text-[10px] text-slate-400 font-mono">12 km road distance • ETA 12.4h • INR 280</p>
                    </div>
                  </div>
                </div>
              )}


              {/* Status Legend */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
                <span>Synchronized at 2026-09-30 22:26 IST</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /> GREEN (Safe)</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /> AMBER (Buffer Warning)</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> RED (Stock-out Risk &ge; 70%)</span>
                </div>
              </div>
            </div>

            {/* Right Facility Intelligence Drawer */}
            <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold font-display text-white text-base">Facility Intelligence Drawer</h3>
                <p className="text-xs text-slate-400">Real-time stock balance &amp; consumption velocity</p>
              </div>

              {selectedFacility ? (
                <div className="space-y-4">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400">Selected Health Facility</p>
                    <p className="text-base font-bold text-white mt-0.5">{selectedFacility.facility?.name || "PHC Anakaputhur"}</p>
                    <p className="text-xs text-cyan-400 font-mono mt-0.5">{selectedFacility.facility?.code || "PHC-Anakaputhur"}</p>
                  </div>

                  {/* Artemether-Lumefantrine Status Card */}
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Artemether-Lumefantrine (AL)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        SURGE ACTIVE
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px]">Effective Stock:</span>
                        <p className="text-lg font-bold text-white">
                          {selectedFacility.facility?.code === "PHC-Anakaputhur" ? "165 packs" : "221 packs"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Daily Demand (d):</span>
                        <p className="text-lg font-bold text-cyan-400">
                          {selectedFacility.facility?.code === "PHC-Anakaputhur" ? "40 packs/d" : "3 packs/d"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Days of Coverage:</span>
                        <p className={`text-base font-bold ${
                          selectedFacility.facility?.code === "PHC-Anakaputhur" ? "text-rose-400" : "text-emerald-400"
                        }`}>
                          {selectedFacility.facility?.code === "PHC-Anakaputhur" ? "4.1 Days" : "33.7 Days"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Poisson Stock-out Risk:</span>
                        <p className={`text-base font-bold ${
                          selectedFacility.facility?.code === "PHC-Anakaputhur" ? "text-rose-400" : "text-emerald-400"
                        }`}>
                          {selectedFacility.facility?.code === "PHC-Anakaputhur" ? "99.0%" : "0.0%"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Autonomous Decision Recommendation</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      MILP solver identified 120-unit transfer from PHC Chromepet (12 km away). Approving averts stock-out before lead time (L=5 days).
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Select any facility on the map to inspect live ledger.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TRANSFER RECOMMENDATION CENTER (Part Y) */}
        {activeTab === "recommendations" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Active Inter-Facility Redistribution Cards</h2>
                <p className="text-xs text-slate-400">Strictly fact-grounded recommendations with human-in-the-loop clinical governance</p>
              </div>
              <span className="text-xs font-mono text-cyan-400">SOLVER: PuLP/CBC (Integer Packs P=10)</span>
            </div>

            {recommendations.length === 0 ? (
              <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Zero Pending Stock Deficits</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  All 5 facilities in Kanchipuram district are currently balanced above their safety horizons. Trigger an outbreak in the Demo Panel to test live redistribution.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all shadow-xl space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          {rec.urgency} URGENCY
                        </span>
                        <span className="font-mono text-xs text-slate-400">ID: {rec.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          STATUS: {rec.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>ETA: {rec.eta_hours}h</span>
                        <span>•</span>
                        <IndianRupee className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Transport Cost: INR {rec.transport_cost_inr}</span>
                      </div>
                    </div>

                    {/* Source -> Destination Transfer Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Source (Surplus Facility)</span>
                        <p className="font-bold text-white text-base mt-0.5">{rec.source_facility_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{rec.source_facility_code}</p>
                        <p className="text-xs text-emerald-400 mt-1">Remaining after: {rec.source_coverage_days}d coverage</p>
                      </div>

                      <div className="flex flex-col items-center justify-center text-center px-4 border-y md:border-y-0 md:border-x border-slate-800 py-3 md:py-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Recommended Transfer</span>
                        <p className="text-2xl font-extrabold text-white font-display mt-0.5">
                          {rec.adjusted_quantity ? rec.adjusted_quantity : rec.quantity} <span className="text-sm font-normal text-slate-400">packs</span>
                        </p>
                        <span className="text-xs text-slate-300 font-semibold mt-0.5">{rec.drug_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-1">Road Distance: {rec.distance_km} km</span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Destination (Deficit Facility)</span>
                        <p className="font-bold text-white text-base mt-0.5">{rec.destination_facility_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{rec.destination_facility_code}</p>
                        <p className="text-xs text-emerald-400 mt-1">Coverage after: {rec.destination_coverage_days}d (Restored to Safe)</p>
                      </div>
                    </div>

                    {/* Grounded AI Explanation (Part L1 & Part Y) */}
                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Why this recommendation? (Grounded Clinical Justification)</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {rec.gemini_explanation}
                      </p>
                    </div>

                    {/* Action Buttons for DMO */}
                    {rec.status === "PENDING" && (
                      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                        <button
                          onClick={() => {
                            setSelectedRec(rec);
                            setActionType("reject");
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-rose-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/50 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span>Reject (Mandatory Reason)</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedRec(rec);
                            setAdjustedQty(rec.quantity);
                            setActionType("adjust");
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Sliders className="w-4 h-4 text-cyan-400" />
                          <span>Adjust Quantity</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedRec(rec);
                            setActionType("approve");
                          }}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold transition-all shadow-glowGreen flex items-center gap-2"
                        >
                          <Check className="w-4 h-4 text-slate-950 font-bold" />
                          <span>Approve Transfer (DMO SLA)</span>
                        </button>
                      </div>
                    )}

                    {/* Dispatched or Approved Voucher details */}
                    {rec.status === "APPROVED" && (
                      <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-emerald-300 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Transfer Approved! Electronic Dispatch Voucher: {rec.voucher_id}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Waiting for Source Pharmacist Dispatch</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ACTION MODAL (Approve / Adjust / Reject) */}
      {actionType && selectedRec && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel-glow max-w-lg w-full rounded-2xl p-6 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white capitalize">
                {actionType === "approve" && "Confirm Inter-Facility Transfer Approval"}
                {actionType === "adjust" && "Adjust Transfer Pack Quantity"}
                {actionType === "reject" && "Reject Recommendation (Mandatory Reason)"}
              </h3>
              <button
                onClick={() => setActionType(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Success Feedback */}
            {actionError && (
              <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Modal Body */}
            {actionType === "approve" && (
              <p className="text-sm text-slate-300 leading-relaxed">
                You are approving the redistribution of <strong className="text-white">{selectedRec.quantity} treatment packs</strong> of {selectedRec.drug_name} from {selectedRec.source_facility_name} to {selectedRec.destination_facility_name}.
                <br /><br />
                This action generates an immutable dispatch voucher, allocates earliest-expiring usable batches via FEFO, and records an audit log.
              </p>
            )}

            {actionType === "adjust" && (
              <div className="space-y-3">
                <label className="text-xs text-slate-400">
                  New Quantity (Must be multiple of pack size P=10):
                </label>
                <input
                  type="number"
                  step="10"
                  min="10"
                  max="200"
                  value={adjustedQty}
                  onChange={(e) => setAdjustedQty(parseInt(e.target.value) || 10)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-base focus:outline-none focus:border-cyan-500"
                />
                <p className="text-xs text-slate-400">
                  Original suggested quantity: {selectedRec.original_quantity} packs.
                </p>
              </div>
            )}

            {actionType === "reject" && (
              <div className="space-y-3">
                <label className="text-xs text-slate-400">Select Mandatory Rejection Reason:</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="INSUFFICIENT_TRANSPORT">INSUFFICIENT_TRANSPORT (Logistics unavailable)</option>
                  <option value="SOURCE_NEEDS_STOCK">SOURCE_NEEDS_STOCK (Source has local surge)</option>
                  <option value="DATA_DOUBTFUL">DATA_DOUBTFUL (Reported stock figures questionable)</option>
                  <option value="ALTERNATE_SUPPLY_ARRANGED">ALTERNATE_SUPPLY_ARRANGED (Direct buffer indent dispatched)</option>
                  <option value="CLINICAL_PRIORITY_OTHER">CLINICAL_PRIORITY_OTHER (Clinical priority re-allocated)</option>
                  <option value="OTHER">OTHER (Requires free-text explanation below)</option>
                </select>

                {rejectReason === "OTHER" && (
                  <div>
                    <label className="text-xs text-slate-400">Free-text Explanation (Mandatory for OTHER):</label>
                    <textarea
                      rows={3}
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                      placeholder="Explain clinical or logistical reason..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-cyan-500 mt-1"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setActionType(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
