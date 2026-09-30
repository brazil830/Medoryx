"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import {
  TrendingUp, BarChart3, AlertTriangle, ShieldCheck, Activity, Cpu,
  Layers, CheckCircle2, AlertCircle, RefreshCw
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, CartesianGrid
} from "recharts";
import ForecastSurface3D from "@/components/3d/ForecastSurface3D";
import { soundFx } from "@/lib/audio";

export default function ForecastLabPage() {
  const { token, activeFacilityId } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState<any | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<string>("FAC-TN-KAN-001");
  const [anomalyResult, setAnomalyResult] = useState<any | null>(null);
  const [forecastMode, setForecastMode] = useState<"3d" | "2d">("3d");


  const loadForecast = async (facId: string) => {
    setLoading(true);
    try {
      const res = await api.getFacilityForecast(facId, token);
      setForecastData(res);
    } catch (err) {
      console.error("Forecast load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast(selectedFacility);
  }, [selectedFacility, token]);

  const handleTestAnomaly = async (issueQty: number, isWeekend: boolean) => {
    try {
      const res = await api.checkAnomaly({
        facility_id: selectedFacility,
        drug_id: "DRUG-AL-01",
        issue_quantity: issueQty,
        is_weekend: isWeekend,
        footfall: 130,
      }, token);
      setAnomalyResult(res);
    } catch (err: any) {
      alert(`Anomaly check error: ${err.message}`);
    }
  };

  // Prepare chart series from daily forecasts
  const chartData = forecastData?.daily_forecasts?.map((val: number, idx: number) => ({
    day: `Day ${idx + 1}`,
    forecast: val,
    lower: forecastData.confidence_bands.alpha_0_1[idx],
    upper: forecastData.confidence_bands.alpha_0_9[idx],
  })) || [];

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col pb-16">
      <Navbar />

      <div className="border-b border-slate-800 bg-[#070E22] px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                PREDICTIVE MULTI-METHOD ENGINE
              </span>
              <span className="text-xs text-slate-400 font-mono">
                MODEL SOURCE: {forecastData?.model_source || "Local LightGBM"}
              </span>
            </div>
            <h1 className="text-2xl font-bold font-display text-white mt-1">
              Forecast &amp; Poisson Risk Laboratory
            </h1>
          </div>

          {/* Facility Selector */}
          <select
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 font-mono"
          >
            <option value="FAC-TN-KAN-001">PHC Anakaputhur (Surge Facility)</option>
            <option value="FAC-TN-KAN-002">PHC Chromepet (Surplus Facility)</option>
            <option value="FAC-TN-KAN-003">PHC Pallavaram</option>
            <option value="FAC-TN-KAN-004">PHC Tambaram</option>
            <option value="FAC-TN-KAN-005">PHC Sriperumbudur</option>
          </select>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 flex-1">
        
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">7-Day Projected Demand</span>
            <p className="text-3xl font-bold font-display text-cyan-400 mt-1">
              {forecastData?.totals?.["7_day"] || 280} <span className="text-xs text-slate-400">packs</span>
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Lead Time L=5 Horizon</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">14-Day Demand Total</span>
            <p className="text-3xl font-bold font-display text-white mt-1">
              {forecastData?.totals?.["14_day"] || 560} <span className="text-xs text-slate-400">packs</span>
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Fortnight Projection</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">30-Day Demand Total</span>
            <p className="text-3xl font-bold font-display text-white mt-1">
              {forecastData?.totals?.["30_day"] || 1200} <span className="text-xs text-slate-400">packs</span>
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Full Monthly Requirement</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">Risk Demand Rate (d)</span>
            <p className="text-3xl font-bold font-display text-amber-400 mt-1">
              {forecastData?.risk_demand_rate || 40.0} <span className="text-xs text-slate-400">packs/d</span>
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Mean over Lead Time L</span>
          </div>
        </div>

        {/* 30-Day Forecast Visualization: 3D Terrain or 2D Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">30-Day Multi-Horizon Consumption Projections</h2>
              <p className="text-xs text-slate-400">
                Quantile regression inference with alpha=0.1 (lower bound) and alpha=0.9 (upper bound)
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs font-mono">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setForecastMode("3d");
                  }}
                  className={`px-3 py-1 rounded font-semibold transition-all ${
                    forecastMode === "3d"
                      ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-glowCyan"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  3D Volumetric Terrain
                </button>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setForecastMode("2d");
                  }}
                  className={`px-3 py-1 rounded font-semibold transition-all ${
                    forecastMode === "2d"
                      ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-glowCyan"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  2D Area Curve
                </button>
              </div>
            </div>
          </div>

          {forecastMode === "3d" ? (
            <ForecastSurface3D
              dailyForecasts={forecastData?.daily_forecasts}
              alpha01={forecastData?.confidence_bands?.alpha_0_1}
              alpha09={forecastData?.confidence_bands?.alpha_0_9}
              currentStock={selectedFacility === "FAC-TN-KAN-001" ? 4 : 120}
              facilityName={selectedFacility}
            />
          ) : (
            <div className="w-full h-80 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0a1226", borderColor: "#1e293b", borderRadius: "8px" }}
                    itemStyle={{ color: "#22d3ee" }}
                  />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="#06b6d4" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="#050B1A" fillOpacity={0.8} />
                  <Line type="monotone" dataKey="forecast" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 3, fill: "#22d3ee" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>


        {/* Feature Importance & Isolation Forest Anomaly Radar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Feature Importance Bar */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base">LightGBM Feature Importance (MDI)</h3>
            <div className="space-y-3">
              {forecastData?.feature_importances?.map((f: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">{f.feature}</span>
                    <span className="text-cyan-400">{Math.round(f.importance * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                      style={{ width: `${f.importance * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Isolation Forest Anomaly Tester */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <h3 className="font-bold text-white text-base">Isolation Forest Anomaly Inspector</h3>
              <p className="text-xs text-slate-400">
                Part M Verification: Pallavaram 5x issue MUST be flagged; Anakaputhur surge MUST NOT be flagged.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => handleTestAnomaly(60, true)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 border border-slate-700 font-semibold"
              >
                Test Pallavaram (60 packs, Weekend)
              </button>
              <button
                onClick={() => handleTestAnomaly(40, false)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 border border-slate-700 font-semibold"
              >
                Test Anakaputhur (40 packs, Outbreak)
              </button>
            </div>

            {anomalyResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                anomalyResult.is_flagged
                  ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                  : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>OUTCOME: {anomalyResult.is_flagged ? "ANOMALY FLAGGED" : "NORMAL (EXPLAINED BY VECTOR)"}</span>
                  <span className="font-mono">Severity: {anomalyResult.severity}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <span>Z-Score: {anomalyResult.z_score}</span>
                  <span>Ratio to Median: {anomalyResult.ratio_to_median}x</span>
                  <span>Outbreak Explained: {anomalyResult.outbreak_explained ? "YES" : "NO"}</span>
                  <span>Model: {anomalyResult.model_label}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
