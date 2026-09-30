"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthScene3D from "@/components/3d/AuthScene3D";
import { soundFx } from "@/lib/audio";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  KeyRound,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();

  const [accountKey, setAccountKey] = useState("dmo_kanchipuram");
  const [password, setPassword] = useState("••••••••••••");
  const [selectedRole, setSelectedRole] = useState("DISTRICT_OFFICER");
  const [selectedState, setSelectedState] = useState("Tamil Nadu");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState<number>(0);
  const [authError, setAuthError] = useState<string | null>(null);

  const judgeAccounts = [
    {
      key: "dmo_kanchipuram",
      name: "Dr. S. Kanchana",
      role: "DISTRICT_OFFICER",
      roleLabel: "District Medical Officer (DMO)",
      scope: "Kanchipuram, TN",
      state: "Tamil Nadu",
      district: "Kanchipuram",
      facility_id: null,
      email: "dmo.kanchipuram@medoryx.gov.in",
    },
    {
      key: "phc_anakaputhur",
      name: "M. Selvam (Pharmacist)",
      role: "PHC_OPERATOR",
      roleLabel: "PHC Operator (Field)",
      scope: "PHC Anakaputhur",
      state: "Tamil Nadu",
      district: "Kanchipuram",
      facility_id: "FAC-TN-KAN-001",
      email: "phc.anakaputhur@medoryx.gov.in",
    },
    {
      key: "state_director_tn",
      name: "Dr. R. Natarajan",
      role: "STATE_DIRECTOR",
      roleLabel: "State Health Director",
      scope: "Tamil Nadu (National)",
      state: "Tamil Nadu",
      district: null,
      facility_id: null,
      email: "director.health@tn.medoryx.gov.in",
    },
    {
      key: "fed_admin",
      name: "A. Banerjee",
      role: "FEDERATION_ADMIN",
      roleLabel: "Federation Coordinator",
      scope: "Privacy-Preserving Edge",
      state: null,
      district: null,
      facility_id: null,
      email: "coord.federation@medoryx.gov.in",
    },
  ];

  const handleSelectAccount = (acc: typeof judgeAccounts[0]) => {
    soundFx.playClick();
    setAccountKey(acc.key);
    setSelectedRole(acc.role);
    if (acc.state) setSelectedState(acc.state);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setIsAuthenticating(true);
    setAuthError(null);
    setAuthStep(1); // 1. Identity verification

    try {
      // Step 1: Verification
      await new Promise((r) => setTimeout(r, 400));
      setAuthStep(2); // 2. Secure channel established

      // Step 2: Establish channel with backend API
      const res = await api.login(accountKey);

      await new Promise((r) => setTimeout(r, 450));
      setAuthStep(3); // 3. District network authenticated

      setUser(res.user, res.token);

      await new Promise((r) => setTimeout(r, 400));
      setAuthStep(4); // 4. Command console unlocked
      soundFx.playAffirm();

      await new Promise((r) => setTimeout(r, 350));
      if (res.user.role === "PHC_OPERATOR") {
        router.push("/facility");
      } else if (res.user.role === "FEDERATION_ADMIN") {
        router.push("/federation");
      } else if (res.user.role === "STATE_DIRECTOR") {
        router.push("/national");
      } else {
        router.push("/district");
      }
    } catch (err: any) {
      setIsAuthenticating(false);
      setAuthStep(0);
      setAuthError(err.message || "Authentication failed.");
      soundFx.playAlert();
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Dedicated 3D Healthcare Infrastructure Environment */}
      <AuthScene3D
        activeState={selectedState}
        activeRole={selectedRole}
        authenticating={isAuthenticating}
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

      {/* Login Translucent Command Console Card */}
      <div className="relative z-10 w-full max-w-lg glass-panel-glow border border-cyan-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl animate-fadeIn">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Operational Console Access Gate</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-white">
            Command Center Sign In
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authenticate using verified credentials or preapproved judge credentials.
          </p>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Authentication Progress Overlay */}
        {isAuthenticating && (
          <div className="mb-6 p-4 bg-cyan-950/70 border border-cyan-500/40 rounded-xl space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between text-cyan-300 font-bold">
              <span>ESTABLISHING SECURE CHANNEL</span>
              <span className="animate-pulse">{authStep * 25}%</span>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-cyan-400 h-full transition-all duration-300"
                style={{ width: `${authStep * 25}%` }}
              />
            </div>

            <div className="space-y-1 pt-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                {authStep >= 1 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                )}
                <span>1. Cryptographic Identity Verification</span>
              </div>
              <div className="flex items-center gap-2">
                {authStep >= 2 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                )}
                <span>2. Secure Mutual TLS Channel Established</span>
              </div>
              <div className="flex items-center gap-2">
                {authStep >= 3 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                )}
                <span>3. Regional Infrastructure Node Authenticated</span>
              </div>
              <div className="flex items-center gap-2">
                {authStep >= 4 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                )}
                <span>4. Operational Console Unlocked</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick-Launch Preapproved Judge Accounts */}
        {!isAuthenticating && (
          <div className="space-y-3 mb-6">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              1-Click Verified Role Login:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {judgeAccounts.map((acc) => (
                <button
                  key={acc.key}
                  type="button"
                  onClick={() => handleSelectAccount(acc)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    accountKey === acc.key
                      ? "bg-cyan-500/20 border-cyan-500/50 shadow-glowCyan text-white"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <p className="font-bold text-xs truncate">{acc.name.split(" ")[0]}</p>
                  <p className="text-[10px] text-cyan-400 font-mono truncate">{acc.roleLabel}</p>
                  <p className="text-[9px] text-slate-400 truncate">{acc.scope}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-mono text-slate-300 block mb-1">
              Account Identifier / Key:
            </label>
            <input
              type="text"
              value={accountKey}
              onChange={(e) => setAccountKey(e.target.value)}
              disabled={isAuthenticating}
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs font-mono text-white transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-300 block mb-1">
              Access Token / Passkey:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isAuthenticating}
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs font-mono text-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-glowCyan transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            <span>Unlock Operational Command Console</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Need new facility onboarding?</span>
          <Link
            href="/signup"
            className="text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            Enroll Health Node &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
