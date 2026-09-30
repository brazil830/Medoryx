"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthScene3D from "@/components/3d/AuthScene3D";
import { soundFx } from "@/lib/audio";
import { useAppStore } from "@/lib/store";
import {
  ShieldCheck,
  Building2,
  MapPin,
  UserCheck,
  ArrowRight,
  Activity,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { setUser, setLanguage } = useAppStore();

  const [stateName, setStateName] = useState("Tamil Nadu");
  const [district, setDistrict] = useState("Kanchipuram");
  const [facilityType, setFacilityType] = useState("PHC");
  const [facilityName, setFacilityName] = useState("PHC Anakaputhur Dispensary");
  const [role, setRole] = useState<"PHC_OPERATOR" | "DISTRICT_OFFICER" | "STATE_DIRECTOR">("PHC_OPERATOR");
  const [operatorName, setOperatorName] = useState("Dr. / Pharmacist Name");
  const [operatorEmail, setOperatorEmail] = useState("operator@medoryx.gov.in");
  const [preferredLang, setPreferredLang] = useState<"en" | "ta" | "hi">("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrolledSuccess, setEnrolledSuccess] = useState(false);

  const handleStateChange = (st: string) => {
    soundFx.playClick();
    setStateName(st);
    if (st === "Tamil Nadu") setDistrict("Kanchipuram");
    else if (st === "Maharashtra") setDistrict("Pune");
    else if (st === "Uttar Pradesh") setDistrict("Varanasi");
    else if (st === "Rajasthan") setDistrict("Jaipur");
    else if (st === "Assam") setDistrict("Kamrup");
    else if (st === "Kerala") setDistrict("Ernakulam");
  };

  const handleSubmitEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playAffirm();
    setIsSubmitting(true);

    setTimeout(() => {
      setUser(
        {
          uid: `usr_${Date.now()}`,
          name: operatorName,
          email: operatorEmail,
          role: role,
          state: stateName,
          district: district,
          facility_id: role === "PHC_OPERATOR" ? "FAC-TN-KAN-001" : null,
        },
        "session_enrolled"
      );
      setLanguage(preferredLang);
      setEnrolledSuccess(true);

      setTimeout(() => {
        if (role === "PHC_OPERATOR") router.push("/facility");
        else if (role === "STATE_DIRECTOR") router.push("/national");
        else router.push("/district");
      }, 800);
    }, 1200);
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 3D Healthcare Infrastructure Environment responding to selected state & role */}
      <AuthScene3D
        activeState={stateName}
        activeRole={role}
        authenticating={isSubmitting}
      />

      {/* Top Brand Bar */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 p-[1.5px] shadow-glowCyan group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#050B1A] rounded-[7px] flex items-center justify-center">
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <span className="font-display font-bold text-white text-base tracking-tight">
            MedOryx<span className="text-cyan-400">-India</span>
          </span>
        </Link>
      </div>

      {/* Enrollment Card */}
      <div className="relative z-10 w-full max-w-xl glass-panel-glow border border-cyan-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl animate-fadeIn">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>National Infrastructure Node Provisioning</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-white">
            Enroll Health Facility Node
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect your primary health dispensary or district command officer account to the national resilience network.
          </p>
        </div>

        {enrolledSuccess ? (
          <div className="p-6 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-center space-y-3 font-mono">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-white">FACILITY NODE PROVISIONED</h3>
            <p className="text-xs text-emerald-300">
              Assigned to {district} Health Cluster &bull; Transferring to console...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitEnrollment} className="space-y-4 text-xs font-mono">
            {/* State Selection */}
            <div>
              <label className="text-slate-300 block mb-1">State Infrastructure Anchor:</label>
              <div className="grid grid-cols-3 gap-2">
                {["Tamil Nadu", "Maharashtra", "Uttar Pradesh", "Rajasthan", "Assam", "Kerala"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStateChange(st)}
                    className={`py-1.5 px-2 rounded-lg border text-left transition-all ${
                      stateName === st
                        ? "bg-cyan-500/25 border-cyan-400 text-white font-bold shadow-glowCyan"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Role & Facility Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1">Operational Role:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="PHC_OPERATOR">PHC Operator (Field Pharmacist)</option>
                  <option value="DISTRICT_OFFICER">District Medical Officer (DMO)</option>
                  <option value="STATE_DIRECTOR">State Health Director</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">District / Facility Tier:</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Operator Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1">Operator Name:</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Gov Mail Identifier:</label>
                <input
                  type="email"
                  value={operatorEmail}
                  onChange={(e) => setOperatorEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Language Preference */}
            <div>
              <label className="text-slate-300 block mb-1">Primary Operating Language:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPreferredLang("en")}
                  className={`py-1.5 rounded-lg border text-center font-bold ${
                    preferredLang === "en" ? "bg-cyan-500/20 border-cyan-400 text-cyan-200" : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredLang("ta")}
                  className={`py-1.5 rounded-lg border text-center font-bold ${
                    preferredLang === "ta" ? "bg-cyan-500/20 border-cyan-400 text-cyan-200" : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  தமிழ் (Tamil)
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredLang("hi")}
                  className={`py-1.5 rounded-lg border text-center font-bold ${
                    preferredLang === "hi" ? "bg-cyan-500/20 border-cyan-400 text-cyan-200" : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-glowCyan transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              <Building2 className="w-4 h-4" />
              <span>{isSubmitting ? "Provisioning Node..." : "Join Resilience Infrastructure"}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Already authorized?</span>
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold">
            Sign In to Console &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
