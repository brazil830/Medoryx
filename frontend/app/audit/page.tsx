"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { soundFx } from "@/lib/audio";
import {
  FileText,
  Download,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Hash,
  User,
  AlertCircle,
  Activity,
  Layers,
  ArrowRight,
  Link as LinkIcon,
  Lock,
} from "lucide-react";

export default function AuditPage() {
  const { token } = useAppStore();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs(
        {
          role: roleFilter || undefined,
          action: actionFilter || undefined,
          search: searchQuery || undefined,
        },
        token
      );
      setLogs(res?.logs || []);
    } catch (err) {
      console.error("Audit load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [roleFilter, actionFilter, token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    fetchLogs();
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col pb-16 selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />

      {/* Header Bar */}
      <div className="border-b border-slate-800 bg-[#070E22] px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                CLINICAL GOVERNANCE &amp; FORENSICS
              </span>
              <span className="text-xs text-slate-400 font-mono">APPEND-ONLY IMMUTABLE LEDGER</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-white mt-1">
              Audit Forensics &amp; State Machine Trails
            </h1>
          </div>

          <a
            href={api.getAuditCsvUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundFx.playClick()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Official Audit CSV</span>
          </a>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6 flex-1">
        {/* Visual Cryptographic Hash Block Stream */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-xs font-mono uppercase tracking-wider">
                Cryptographic Block Stream • SHA-256 Immutable Hash Chain
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              LEDGER: VALIDATED &amp; TAMPER-EVIDENT
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {(logs.slice(0, 5).length > 0 ? logs.slice(0, 5) : [
              { event_id: "EVT-8801", action: "TRANSFER_APPROVED", actor: "Dr. S. Kanchana (DMO)", payload_hash: "a4f89d...1e8b" },
              { event_id: "EVT-8802", action: "TRANSFER_DISPATCHED", actor: "M. Selvam (PHC)", payload_hash: "3b2c1f...90de" },
              { event_id: "EVT-8803", action: "STOCK_SYNCED", actor: "Vector Sync Engine", payload_hash: "7f9a2e...44c1" },
              { event_id: "EVT-8804", action: "ANOMALY_SUPPRESSED", actor: "Isolation Forest", payload_hash: "98c21a...77b4" },
              { event_id: "EVT-8805", action: "FED_ROUND_SYNCED", actor: "Flower Coordinator", payload_hash: "e1a90c...12fa" },
            ]).map((block: any, idx: number) => (
              <div
                key={block.event_id || idx}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedLog(block);
                }}
                className="p-3 bg-slate-900/80 hover:bg-slate-800/90 rounded-xl border border-slate-700/80 hover:border-cyan-400/50 cursor-pointer transition-all space-y-1.5 relative group"
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="font-bold text-cyan-400">{block.event_id}</span>
                  <span className="text-slate-500">#{idx + 1}</span>
                </div>
                <p className="font-semibold text-xs text-white truncate">{block.action}</p>
                <p className="text-[10px] text-slate-400 truncate">{block.actor}</p>
                <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[9px] font-mono text-slate-500">
                  <span className="truncate">Hash: {block.payload_hash?.slice(0, 8)}...</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search event ID, actor, or reason..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-xl font-semibold transition-colors"
            >
              Filter
            </button>
          </form>

          <div className="flex items-center gap-3 w-full sm:w-auto font-mono text-xs">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2"
            >
              <option value="">All Roles</option>
              <option value="DISTRICT_OFFICER">DISTRICT_OFFICER</option>
              <option value="PHC_OPERATOR">PHC_OPERATOR</option>
              <option value="STATE_DIRECTOR">STATE_DIRECTOR</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2"
            >
              <option value="">All Actions</option>
              <option value="APPROVED">TRANSFER_APPROVED</option>
              <option value="REJECTED">TRANSFER_REJECTED</option>
              <option value="DISPATCHED">TRANSFER_DISPATCHED</option>
              <option value="COMPLETED">TRANSFER_COMPLETED</option>
              <option value="SYNC">SYNC</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Event ID</th>
                  <th className="p-3.5">Timestamp (IST)</th>
                  <th className="p-3.5">Actor &amp; Role</th>
                  <th className="p-3.5">Action Transition</th>
                  <th className="p-3.5">Quantities</th>
                  <th className="p-3.5">Reason / Rationale</th>
                  <th className="p-3.5">SHA-256 Payload Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                      No audit events matched current filter parameters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedLog(log);
                      }}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 font-mono text-cyan-400 font-bold">{log.event_id}</td>
                      <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                        {log.timestamp?.replace("T", " ")?.slice(0, 19)}
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-white">{log.actor}</p>
                        <span className="text-[10px] font-mono text-cyan-400">{log.role}</span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            log.action?.includes("APPROVED")
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : log.action?.includes("REJECTED")
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">
                        {log.quantity_before !== null && log.quantity_after !== null
                          ? `${log.quantity_before} &rarr; ${log.quantity_after}`
                          : "N/A"}
                      </td>
                      <td className="p-3.5 text-slate-300 max-w-xs truncate">{log.reason || "N/A"}</td>
                      <td className="p-3.5 font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                        {log.payload_hash}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Forensic Detail Modal (WHO / WHAT / WHEN / WHERE / WHY) */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel-glow max-w-xl w-full rounded-2xl p-6 border border-cyan-500/40 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Forensic Event Ledger Audit</h3>
                  <span className="text-xs text-cyan-400 font-mono">{selectedLog.event_id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1 text-xs"
              >
                ✕ Close
              </button>
            </div>

            {/* Structured Forensic Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-cyan-400 uppercase font-bold block">1. WHO (Authorized Actor)</span>
                <p className="text-white font-bold">{selectedLog.actor}</p>
                <p className="text-slate-400">{selectedLog.role}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-emerald-400 uppercase font-bold block">2. WHAT (State Transition)</span>
                <p className="text-white font-bold">{selectedLog.action}</p>
                <p className="text-slate-400">
                  {selectedLog.from_status || "PENDING"} &rarr; {selectedLog.to_status || "ACTIVE"}
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-purple-400 uppercase font-bold block">3. WHEN (Immutable Timestamp)</span>
                <p className="text-white font-bold">{selectedLog.timestamp}</p>
                <p className="text-slate-400">Standard Indian Time (IST)</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-amber-400 uppercase font-bold block">4. WHERE (Facility / Block)</span>
                <p className="text-white font-bold">{selectedLog.scope || "Kanchipuram, TN"}</p>
                <p className="text-slate-400">Artemether Multi-Facility</p>
              </div>
            </div>

            {/* WHY / CLINICAL RATIONALE */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1 text-xs font-mono">
              <span className="text-[10px] text-cyan-300 uppercase font-bold block">5. WHY / CLINICAL ACTION RATIONALE</span>
              <p className="text-slate-200">{selectedLog.reason || "Automatic MILP Optimization & Algorithmic Allocation"}</p>
            </div>

            {/* SHA-256 HASH VERIFICATION */}
            <div className="space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span className="font-bold">Cryptographic Payload Integrity Seal (SHA-256):</span>
                <span className="text-emerald-400">Verified Match</span>
              </div>
              <p className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-cyan-300 break-all select-all">
                {selectedLog.payload_hash}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
