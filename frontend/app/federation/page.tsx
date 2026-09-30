"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import {
  Network, ShieldCheck, Lock, Play, RefreshCw, CheckCircle2,
  AlertCircle, Activity, Globe, Cpu, Layers
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from "recharts";
import FederationNetwork3D from "@/components/3d/FederationNetwork3D";
import { soundFx } from "@/lib/audio";

export default function FederationPage() {
  const { token } = useAppStore();
  const [fedData, setFedData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningRound, setRunningRound] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadFederation = async () => {
    setLoading(true);
    try {
      const res = await api.getFederationStatus(token);
      setFedData(res);
    } catch (err) {
      console.error("Federation status error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFederation();
  }, [token]);

  const handleRunRound = async () => {
    if (runningRound) return;
    setRunningRound(true);
    setNotice(null);
    try {
      const res = await api.runFederatedRound(token);
      if (res.success) {
        setNotice(`Round ${res.round_number} completed! Global loss reduced to ${res.global_loss}. Epsilon: ${res.epsilon}.`);
      } else {
        setNotice(`Warning: ${res.message}`);
      }
      await loadFederation();
    } catch (err: any) {
      setNotice(`Round execution error: ${err.message}`);
    } finally {
      setRunningRound(false);
    }
  };

  const chartSeries = fedData?.rounds?.map((r: any) => ({
    round: `Round ${r.round_number}`,
    globalLoss: r.global_loss,
    indiaMAE: r.india_mae,
    brazilMAE: r.brazil_mae,
    epsilon: r.epsilon,
  })) || [];

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col pb-16">
      <Navbar />

      <div className="border-b border-slate-800 bg-[#070E22] px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30">
                PRIVACY-PRESERVING FEDERATED LEARNING
              </span>
              <span className="text-xs text-slate-400 font-mono">
                FRAMEWORK: FLOWER + OPACUS DP-SGD
              </span>
            </div>
            <h1 className="text-2xl font-bold font-display text-white mt-1">
              Federated Governance &amp; BRICS Resilience Hub
            </h1>
          </div>

          <button
            onClick={handleRunRound}
            disabled={runningRound || fedData?.budget_exhausted}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-glowCyan disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${runningRound ? "animate-spin" : ""}`} />
            <span>{runningRound ? "Aggregating Weights..." : "Execute Federated Round 6"}</span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 flex-1">
        
        {/* Privacy Guarantees Banner (Part N) */}
        <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                Cryptographic &amp; Differential Privacy Guarantee
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Raw clinical records and facility ledgers NEVER leave national edge nodes. Only differentially private model weight updates are transmitted.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-md text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
            ENCRYPTION: SIMULATED (mTLS)
          </span>
        </div>

        {/* Notice Feedback */}
        {notice && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">Current Round</span>
            <p className="text-3xl font-bold font-display text-white mt-1">
              Round {fedData?.latest_round || 5}
            </p>
            <span className="text-[10px] text-cyan-400 font-mono mt-1 block">FedProx Aggregation (&mu;=0.01)</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">Opacus DP Epsilon (&epsilon;)</span>
            <p className="text-3xl font-bold font-display text-purple-400 mt-1">
              {fedData?.current_epsilon || 2.15}
            </p>
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">Ceiling: &le; 3.0 (&delta;=1e-5)</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">India Node MAE</span>
            <p className="text-3xl font-bold font-display text-emerald-400 mt-1">
              {fedData?.nodes?.[0]?.local_mae || 3.15}
            </p>
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">Daily Issue Error</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">Brazil Node MAE</span>
            <p className="text-3xl font-bold font-display text-emerald-400 mt-1">
              {fedData?.nodes?.[1]?.local_mae || 3.40}
            </p>
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">Dengue Surge Model</span>
          </div>
        </div>

        {/* 3D Interactive BRICS Federation Mesh */}
        <FederationNetwork3D onTriggerRound={handleRunRound} isRunningRound={runningRound} />

        {/* Federated Loss & MAE Descent Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">

          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">Cross-National Convergence Curves</h2>
              <p className="text-xs text-slate-400">
                Global MSE loss and local node mean absolute error descending across rounds
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Global Loss</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> India MAE</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Brazil MAE</span>
            </div>
          </div>

          <div className="w-full h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="round" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0a1226", borderColor: "#1e293b", borderRadius: "8px" }}
                  itemStyle={{ color: "#c084fc" }}
                />
                <Line type="monotone" dataKey="globalLoss" stroke="#c084fc" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="indiaMAE" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="brazilMAE" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Node Telemetry Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fedData?.nodes?.map((node: any) => (
            <div key={node.node_id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white text-sm">{node.country} Edge Coordinator</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {node.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                <p>Node ID: {node.node_id}</p>
                <p>Samples: {node.sample_count?.toLocaleString()}</p>
                <p>Local MAE: {node.local_mae}</p>
                <p>DP Noise: &sigma;=1.12</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
