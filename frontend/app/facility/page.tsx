"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { offlineQueue } from "@/lib/offlineQueue";
import {
  Package, AlertTriangle, CheckCircle2, Mic, Camera, FileText, Send,
  RefreshCw, WifiOff, Clock, ShieldCheck, ChevronRight, Sparkles, AlertCircle
} from "lucide-react";

export default function FacilityConsolePage() {
  const { user, token, isOffline, offlineQueueCount, setOfflineQueueCount } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<any | null>(null);
  const [selectedDrug, setSelectedDrug] = useState<any | null>(null);

  // Stock Logging Modal State
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logMode, setLogMode] = useState<"manual" | "voice" | "vision">("manual");
  
  // Voice & Vision form fields
  const [actionType, setActionType] = useState<string>("ISSUE");
  const [drugId, setDrugId] = useState<string>("DRUG-AL-01");
  const [batchNumber, setBatchNumber] = useState<string>("B240601");
  const [quantity, setQuantity] = useState<number>(30);
  const [recipientCat, setRecipientCat] = useState<string>("OUTPATIENT_MALARIA");
  
  // Review & Confidence State
  const [reviewRequired, setReviewRequired] = useState(false);
  const [confidenceInfo, setConfidenceInfo] = useState<any | null>(null);
  const [logNotice, setLogNotice] = useState<string | null>(null);

  const facilityId = user?.facility_id || "FAC-TN-KAN-001";

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await api.getFacilityInventory(facilityId, token);
      setInventoryData(res);
      if (res?.inventory?.length > 0 && !selectedDrug) {
        setSelectedDrug(res.inventory[0]);
      }
    } catch (err: any) {
      console.error("Failed to load facility inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
    const interval = setInterval(loadInventory, 6000);
    return () => clearInterval(interval);
  }, [facilityId, token]);

  // Voice command simulation: "Issued 30 Artemether tablets for malaria"
  const handleSimulateVoice = async () => {
    try {
      const parsed = await api.parseVoice("Issued 30 Artemether packs for outpatient malaria");
      setActionType(parsed.action);
      setQuantity(parsed.quantity);
      setBatchNumber(parsed.batch);
      setRecipientCat(parsed.recipient_category);
      setReviewRequired(true);
      setConfidenceInfo({
        source: "Speech-to-Text + Gemini Parser",
        confidence: parsed.confidence,
        transcript: parsed.redacted_transcript,
      });
    } catch (err: any) {
      alert(`Voice parse error: ${err.message}`);
    }
  };

  // Vision scan simulation: scan medicine strip / register (55 packs)
  const handleSimulateVision = async () => {
    try {
      const parsed = await api.extractVision("al_medicine_box.jpg");
      setActionType("ISSUE");
      setQuantity(parsed.quantity.value);
      setBatchNumber(parsed.batch_number.value);
      setRecipientCat(parsed.recipient_category.value);
      setReviewRequired(true);
      setConfidenceInfo({
        source: "Gemini Multimodal Vision (In-Memory)",
        confidence: parsed.drug_name.confidence,
        fields: parsed,
      });
    } catch (err: any) {
      alert(`Vision scan error: ${err.message}`);
    }
  };

  // Explicit Save Confirmation (Never auto-save, Part K3)
  const handleSaveMutation = async () => {
    setLogNotice(null);
    const mutationId = `MUT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const mutationItem = {
      mutation_id: mutationId,
      timestamp: new Date().toISOString(),
      entity_type: "INVENTORY_LEDGER",
      payload: {
        drug_id: drugId,
        batch_number: batchNumber,
        action_type: actionType,
        quantity: Number(quantity),
        recipient_category: recipientCat,
      },
      vector_clock: 1,
    };

    if (isOffline) {
      // Enqueue to IndexedDB
      await offlineQueue.enqueue(mutationItem);
      const count = await offlineQueue.count();
      setOfflineQueueCount(count);
      setLogNotice(`Mutation queued in IndexedDB offline storage (Queue count: ${count}).`);
    } else {
      // Online immediate sync
      try {
        await api.syncInventory({
          client_id: "phc-console-01",
          last_sync_vector_clock: 0,
          mutations: [mutationItem],
        }, token);
        setLogNotice(`Stock transaction applied to authoritative ledger!`);
        await loadInventory();
      } catch (err: any) {
        // Fallback to queue if network error occurs
        await offlineQueue.enqueue(mutationItem);
        const count = await offlineQueue.count();
        setOfflineQueueCount(count);
        setLogNotice(`Network unavailable. Saved safely to offline queue (${count} pending).`);
      }
    }

    setTimeout(() => {
      setLogModalOpen(false);
      setReviewRequired(false);
      setConfidenceInfo(null);
      setLogNotice(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col pb-16">
      <Navbar />

      {/* Mobile-Optimized Header */}
      <div className="border-b border-slate-800 bg-[#070E22] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                PHC TIER
              </span>
              <span className="text-[11px] text-slate-400 font-mono">ID: {facilityId}</span>
            </div>
            <h1 className="text-xl font-bold font-display text-white mt-0.5">
              {inventoryData?.facility?.name || "PHC Anakaputhur"}
            </h1>
          </div>

          <button
            onClick={() => {
              setLogModalOpen(true);
              setLogMode("manual");
              setReviewRequired(false);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-glowCyan transition-all"
          >
            <Package className="w-4 h-4" />
            <span>Log Stock</span>
          </button>
        </div>
      </div>

      {/* Offline Status Banner if Offline */}
      {isOffline && (
        <div className="bg-amber-950/80 border-b border-amber-500/40 text-amber-200 px-4 py-2 text-xs flex items-center justify-between max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span>OPERATING IN OFFLINE MODE • Mutations stored in local IndexedDB</span>
          </div>
          <span className="font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
            Queue: {offlineQueueCount}
          </span>
        </div>
      )}

      {/* Main PHC Viewport (Optimized for Mobile Touch) */}
      <main className="max-w-4xl mx-auto px-4 py-6 w-full space-y-6">
        
        {/* Core Stock Metrics Grid */}
        {inventoryData?.inventory?.map((drug: any) => (
          <div
            key={drug.drug_id}
            className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">ESSENTIAL DRUG</span>
                <h3 className="text-lg font-bold text-white font-display mt-0.5">{drug.drug_name}</h3>
                <span className="text-xs text-slate-400 font-mono">Pack size: P={drug.pack_size}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                drug.status === "RED" ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse" :
                drug.status === "AMBER" ? "bg-amber-500/20 text-amber-300 border-amber-500/50" :
                "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
              }`}>
                {drug.status} ({drug.days_of_stock} Days Left)
              </span>
            </div>

            {/* 4 Stock Buckets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Usable Stock</span>
                <p className="text-xl font-bold text-white mt-0.5">{drug.usable_stock}</p>
                <span className="text-[10px] text-slate-500">Packs on hand</span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Reserved</span>
                <p className="text-xl font-bold text-amber-400 mt-0.5">{drug.reserved}</p>
                <span className="text-[10px] text-slate-500">Committed out</span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Incoming</span>
                <p className="text-xl font-bold text-cyan-400 mt-0.5">{drug.incoming}</p>
                <span className="text-[10px] text-slate-500">In transit</span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Effective Stock</span>
                <p className="text-xl font-bold text-emerald-400 mt-0.5">{drug.effective_stock}</p>
                <span className="text-[10px] text-slate-500">Usable - Res + Inc</span>
              </div>
            </div>

            {/* Velocity & Risk Indicators */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Demand Rate (d):</span>
                <span className="font-bold text-white">{drug.demand_per_day} packs/day</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Stock-out Risk:</span>
                <span className={`font-bold ${drug.p_stockout >= 0.70 ? "text-rose-400" : "text-emerald-400"}`}>
                  {Math.round(drug.p_stockout * 100)}% Poisson
                </span>
              </div>
            </div>

            {/* Usable Batches FEFO Table */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-300 mb-2 block">Usable Batches (FEFO Expiry Order):</span>
              <div className="space-y-1.5">
                {drug.batches?.map((b: any, bIdx: number) => (
                  <div key={bIdx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 text-xs border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400">{b.batch_number}</span>
                      <span className="text-[10px] text-slate-400">Exp: {b.expiry_date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-300 font-semibold">{b.quantity} units</span>
                      {b.at_risk_units > 0 && (
                        <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {b.at_risk_units} at-risk
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* STOCK LOGGING MODAL (Manual / Voice / Vision) */}
      {logModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel-glow max-w-md w-full rounded-2xl p-6 border border-slate-700 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold font-display text-white text-base">Record Medicine Stock Delta</h3>
              <button onClick={() => setLogModalOpen(false)} className="text-slate-400 hover:text-white text-xs">
                Close
              </button>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => { setLogMode("manual"); setReviewRequired(false); }}
                className={`py-2 rounded-lg font-medium transition-colors ${
                  logMode === "manual" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400"
                }`}
              >
                Manual Entry
              </button>
              <button
                onClick={() => { setLogMode("voice"); handleSimulateVoice(); }}
                className={`py-2 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors ${
                  logMode === "voice" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice</span>
              </button>
              <button
                onClick={() => { setLogMode("vision"); handleSimulateVision(); }}
                className={`py-2 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors ${
                  logMode === "vision" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Vision</span>
              </button>
            </div>

            {/* Notice / Feedback */}
            {logNotice && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{logNotice}</span>
              </div>
            )}

            {/* Confidence & Review Banner (Part K3 & K4) */}
            {reviewRequired && confidenceInfo && (
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between text-cyan-300 font-bold">
                  <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> AI Extraction Confidence</span>
                  <span className="font-mono text-emerald-400">{Math.round(confidenceInfo.confidence * 100)}% (CONFIDENT)</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Extracted via {confidenceInfo.source}. Mandatory clinical review required before ledger mutation.
                </p>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Action Type:</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white"
                  >
                    <option value="ISSUE">ISSUE (Dispensary Out)</option>
                    <option value="RECEIPT">RECEIPT (Stock In)</option>
                    <option value="ADJUST">ADJUST (Inventory Count)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Batch Number:</label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Quantity (Units / Packs):</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-mono text-base"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Recipient Category:</label>
                  <select
                    value={recipientCat}
                    onChange={(e) => setRecipientCat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white"
                  >
                    <option value="OUTPATIENT_MALARIA">OUTPATIENT_MALARIA</option>
                    <option value="OUTPATIENT_GENERAL">OUTPATIENT_GENERAL</option>
                    <option value="WARD">WARD</option>
                    <option value="CAMP">CAMP</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Explicit Confirm Button (Never Auto-Save) */}
            <div className="pt-2">
              <button
                onClick={handleSaveMutation}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-sm shadow-glowGreen transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 font-bold" />
                <span>Explicit Review &amp; Save Mutation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
