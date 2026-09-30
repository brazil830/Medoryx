"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { soundFx } from "@/lib/audio";
import {
  Sparkles,
  Send,
  Mic,
  Volume2,
  ShieldCheck,
  ArrowRight,
  Bot,
  User,
  Globe,
  AlertCircle,
  CheckCircle2,
  CornerDownLeft,
  Activity,
  MapPin,
  Truck,
  Layers,
  AlertTriangle,
} from "lucide-react";

interface Message {
  sender: "user" | "copilot";
  text: string;
  citations?: string[];
  actions?: { label: string; url: string }[];
  highlightFacilities?: string[];
  providerStatus?: string;
  timestamp: string;
}

export default function CopilotPage() {
  const { user, token, language } = useAppStore();

  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([
    "FAC-TN-KAN-001",
    "FAC-TN-KAN-002",
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "copilot",
      text: "Namaste Officer. I am your operational Health Supply Copilot for ResilHealth-India. I am directly grounded in PostgreSQL inventory ledgers, Poisson stock-out models, and MILP redistribution solutions. How can I assist your operational decisions today?",
      citations: ["National Health Supply Engine", "PostgreSQL Ledger"],
      highlightFacilities: ["FAC-TN-KAN-001", "FAC-TN-KAN-002"],
      timestamp: "10:00 IST",
    },
  ]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || loading) return;
    soundFx.playClick();

    const userMsg: Message = {
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " IST",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    // Auto highlight nodes based on query keywords
    const lowerQ = q.toLowerCase();
    const targetedNodes: string[] = [];
    if (lowerQ.includes("anakaputhur") || lowerQ.includes("risk") || lowerQ.includes("stock-out")) {
      targetedNodes.push("FAC-TN-KAN-001");
    }
    if (lowerQ.includes("chromepet") || lowerQ.includes("excess") || lowerQ.includes("surplus")) {
      targetedNodes.push("FAC-TN-KAN-002");
    }
    if (lowerQ.includes("sriperumbudur")) {
      targetedNodes.push("FAC-TN-KAN-003");
    }
    if (targetedNodes.length > 0) {
      setHighlightedNodes(targetedNodes);
    }

    try {
      const res = await api.queryCopilot(q, language, token);
      const botMsg: Message = {
        sender: "copilot",
        text: res.response,
        citations: res.citations,
        actions: res.suggested_actions,
        highlightFacilities: targetedNodes.length > 0 ? targetedNodes : ["FAC-TN-KAN-001"],
        providerStatus: res.provider_status,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " IST",
      };
      setMessages((prev) => [...prev, botMsg]);
      soundFx.playAffirm();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: `Copilot operational error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " IST",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTTS = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      if (language === "ta") utterance.lang = "ta-IN";
      else if (language === "hi") utterance.lang = "hi-IN";
      else utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

  const samplePrompts = [
    "Which PHCs will run out of medicines in 7 days?",
    "Why is Anakaputhur at high risk?",
    "Which facilities have excess AL stock?",
    "Show pending approvals in Kanchipuram",
  ];

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col pb-16 selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />

      {/* Header Bar */}
      <div className="border-b border-slate-800 bg-[#070E22] px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 p-[1.5px] shadow-glowCyan">
              <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-white">Health Supply Copilot</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  GROUNDED OPERATIONAL AI
                </span>
              </div>
              <p className="text-xs text-slate-400">Deterministic backend verification &bull; Zero hallucinated quantities</p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 font-mono">ROLE SCOPE:</span>
            <p className="text-xs font-bold text-cyan-400">{user.role}</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chat Stream & Input */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          {/* Chat Stream Viewport */}
          <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800 flex-1 space-y-6 overflow-y-auto max-h-[580px]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "copilot" && (
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-cyan-400" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed space-y-2 ${
                    m.sender === "user"
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-slate-950 font-medium ml-auto"
                      : "bg-slate-900/90 border border-slate-800 text-slate-200"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>

                  {/* Citations & Suggested Action Links */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono space-y-1">
                      <p className="font-bold text-cyan-400">DATA CITATIONS:</p>
                      <ul className="list-disc list-inside">
                        {m.citations.map((c, cIdx) => (
                          <li key={cIdx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {m.actions && m.actions.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {m.actions.map((act, aIdx) => (
                        <Link
                          key={aIdx}
                          href={act.url}
                          onClick={() => soundFx.playClick()}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>{m.timestamp}</span>
                    {m.sender === "copilot" && (
                      <button
                        onClick={() => handleTTS(m.text)}
                        className="hover:text-cyan-400 transition-colors flex items-center gap-1 font-mono"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Speak</span>
                      </button>
                    )}
                  </div>
                </div>

                {m.sender === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-blue-300" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
                <div className="glass-panel p-3 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Grounding against database ledgers and Poisson models...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-colors text-left"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="glass-panel p-2 rounded-2xl border border-slate-800 flex items-center gap-2">
            <button
              onClick={() => handleSend("Issued 30 Artemether treatment packs for malaria")}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors"
              title="Simulate Spoken Query"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask Copilot about stocks, stock-outs, or transfers (EN / தமிழ் / हिन्दी)..."
              className="w-full bg-transparent border-none text-white text-sm focus:outline-none px-2 font-mono"
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Spatial Telemetry Radar HUD */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-xs font-mono uppercase tracking-wider">
                  Operational Spatial Radar
                </h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>

            {/* Spatial Node Status Cards */}
            <div className="space-y-3 font-mono text-xs">
              {/* Anakaputhur Node */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  highlightedNodes.includes("FAC-TN-KAN-001")
                    ? "bg-rose-950/40 border-rose-500/60 shadow-glowRed"
                    : "bg-slate-900/60 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-bold text-white">PHC Anakaputhur</span>
                  </div>
                  <span className="text-[10px] text-rose-400 font-bold px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">
                    CRITICAL DEFICIT
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                  <p>Stock: <strong className="text-white">4 Packs</strong></p>
                  <p>Buffer: <strong className="text-rose-400">0.8 Days</strong></p>
                  <p>Risk: <strong className="text-rose-400">94% Poisson</strong></p>
                  <p>SKU: <strong>Artemether</strong></p>
                </div>
              </div>

              {/* Chromepet Node */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  highlightedNodes.includes("FAC-TN-KAN-002")
                    ? "bg-emerald-950/40 border-emerald-500/60 shadow-glowGreen"
                    : "bg-slate-900/60 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white">PHC Chromepet</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                    SURPLUS HUB
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                  <p>Stock: <strong className="text-white">320 Packs</strong></p>
                  <p>Surplus: <strong className="text-emerald-400">+200 Units</strong></p>
                  <p>Buffer: <strong className="text-emerald-400">28 Days</strong></p>
                  <p>Expiry: <strong>60 Days FEFO</strong></p>
                </div>
              </div>

              {/* Recommended Action Preview */}
              <div className="p-3.5 bg-cyan-950/30 border border-cyan-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-[11px]">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Proposed Redistribution Action</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  PuLP solver generated transfer of <strong>120 packs</strong> from Chromepet to Anakaputhur (12 km, INR 280, ETA 12.4h).
                </p>
                <Link
                  href="/district"
                  onClick={() => soundFx.playClick()}
                  className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1.5 text-xs transition-all shadow-glowCyan"
                >
                  <span>Open DMO Approval Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
