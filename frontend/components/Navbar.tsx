"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert, Activity, Wifi, WifiOff, Globe, UserCheck, RefreshCw,
  Menu, X, ChevronDown, CheckCircle2, AlertCircle, Database, Volume2, VolumeX, LogIn
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/i18n";
import { offlineQueue } from "@/lib/offlineQueue";
import { soundFx } from "@/lib/audio";

export default function Navbar() {
  const pathname = usePathname();
  const {
    user,
    token,
    language,
    isOffline,
    offlineQueueCount,
    setUser,
    setLanguage,
    setIsOffline,
    setOfflineQueueCount,
  } = useAppStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    setAudioEnabled(soundFx.getEnabled());
  }, []);


  const t = translations[language] || translations.en;

  // Listen to browser online/offline status and poll queue
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const checkQueue = async () => {
      const count = await offlineQueue.count();
      setOfflineQueueCount(count);
    };

    checkQueue();
    const interval = setInterval(checkQueue, 3000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [setIsOffline, setOfflineQueueCount]);

  const handleSyncNow = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncNotice(null);
    try {
      const res = await offlineQueue.flushSync(token);
      const count = await offlineQueue.count();
      setOfflineQueueCount(count);
      setSyncNotice(`Synchronized: ${res?.processed_mutations?.length || 0} mutations applied.`);
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err: any) {
      setSyncNotice(`Sync Error: ${err.message}`);
      setTimeout(() => setSyncNotice(null), 4000);
    } finally {
      setSyncing(false);
    }
  };

  const judgeAccounts = [
    {
      key: "dmo_kanchipuram",
      name: "Dr. S. Kanchana",
      role: "DISTRICT_OFFICER" as const,
      roleLabel: "District Medical Officer (DMO)",
      scope: "Kanchipuram, TN",
      state: "Tamil Nadu",
      district: "Kanchipuram",
      facility_id: null,
      email: "dmo.kanchipuram@medoryx.gov.in"
    },
    {
      key: "phc_anakaputhur",
      name: "M. Selvam (Pharmacist)",
      role: "PHC_OPERATOR" as const,
      roleLabel: "PHC Operator (Field)",
      scope: "PHC Anakaputhur",
      state: "Tamil Nadu",
      district: "Kanchipuram",
      facility_id: "FAC-TN-KAN-001",
      email: "phc.anakaputhur@medoryx.gov.in"
    },
    {
      key: "state_director_tn",
      name: "Dr. R. Natarajan",
      role: "STATE_DIRECTOR" as const,
      roleLabel: "State Health Director",
      scope: "Tamil Nadu (National)",
      state: "Tamil Nadu",
      district: null,
      facility_id: null,
      email: "director.health@tn.medoryx.gov.in"
    },
    {
      key: "fed_admin",
      name: "A. Banerjee",
      role: "FEDERATION_ADMIN" as const,
      roleLabel: "Federation Coordinator",
      scope: "Privacy-Preserving Edge",
      state: null,
      district: null,
      facility_id: null,
      email: "coord.federation@medoryx.gov.in"
    },
  ];

  const isConsoleRoute = pathname.startsWith("/dashboard") ||
    pathname.startsWith("/district") ||
    pathname.startsWith("/facility") ||
    pathname.startsWith("/national") ||
    pathname.startsWith("/copilot") ||
    pathname.startsWith("/forecast") ||
    pathname.startsWith("/federation") ||
    pathname.startsWith("/audit") ||
    pathname.startsWith("/demo");

  return (
    <header className="sticky top-0 z-50 w-full bg-[#030712]/95 backdrop-blur-2xl border-b border-slate-800/90 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-emerald-500 to-blue-600 p-[1.5px] shadow-glowCyan group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#050B1A] rounded-[7px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulseSlow" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg text-white tracking-tight">
                MedOryx<span className="text-cyan-400">-India</span>
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                BRICS TRACK
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">National Health Supply Resilience</p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-300">
          <Link
            href="/district"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              pathname === "/district" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "hover:text-white hover:bg-slate-800/50"
            }`}
          >
            {t.districtConsole}
          </Link>
          <Link
            href="/facility"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              pathname === "/facility" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "hover:text-white hover:bg-slate-800/50"
            }`}
          >
            {t.facilityConsole}
          </Link>
          <Link
            href="/national"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              pathname === "/national" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "hover:text-white hover:bg-slate-800/50"
            }`}
          >
            {t.nationalMap}
          </Link>
          <Link
            href="/forecast"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              pathname === "/forecast" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "hover:text-white hover:bg-slate-800/50"
            }`}
          >
            {t.forecastLab}
          </Link>
          <Link
            href="/federation"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              pathname === "/federation" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "hover:text-white hover:bg-slate-800/50"
            }`}
          >
            {t.federationHub}
          </Link>
          <Link
            href="/copilot"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              pathname === "/copilot" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "hover:text-white hover:bg-slate-800/50"
            }`}
          >
            {t.copilot}
          </Link>
          <Link
            href="/audit"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              pathname === "/audit" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "hover:text-white hover:bg-slate-800/50"
            }`}
          >
            {t.auditForensics}
          </Link>
          <Link
            href="/demo"
            className={`px-2.5 py-1.5 rounded-md text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors ${
              pathname === "/demo" ? "ring-1 ring-amber-400" : ""
            }`}
          >
            {t.demoPanel}
          </Link>
        </nav>

        {/* Right Tools: Language, Offline Sync, Role Switcher */}
        <div className="flex items-center gap-2">
          
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setLanguage("en")}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${language === "en" ? "bg-cyan-500/30 text-cyan-300" : "text-slate-400 hover:text-white"}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("ta")}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${language === "ta" ? "bg-cyan-500/30 text-cyan-300" : "text-slate-400 hover:text-white"}`}
            >
              தமிழ்
            </button>
            <button
              onClick={() => setLanguage("hi")}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${language === "hi" ? "bg-cyan-500/30 text-cyan-300" : "text-slate-400 hover:text-white"}`}
            >
              हिन्दी
            </button>
          </div>

          {/* Audio Feedback Toggle */}
          <button
            onClick={() => setAudioEnabled(soundFx.toggle())}
            title={audioEnabled ? "Tactile Audio Active (Click to Mute)" : "Tactile Audio Muted (Click to Enable)"}
            className={`p-1.5 rounded-lg border text-xs transition-all ${
              audioEnabled
                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-glowCyan"
                : "bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white"
            }`}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Portal Login Link */}
          <Link
            href="/login"
            onClick={() => soundFx.playClick()}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5 text-cyan-400" />
            <span>Login</span>
          </Link>

          {/* Offline / Online Indicator & Sync Button */}
          <div className="flex items-center gap-1.5">

            <button
              onClick={() => setIsOffline(!isOffline)}
              title={isOffline ? "Click to simulate Online" : "Click to simulate Offline"}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                isOffline
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isOffline ? "OFFLINE" : "ONLINE"}</span>
            </button>

            {offlineQueueCount > 0 && (
              <button
                onClick={handleSyncNow}
                disabled={syncing || isOffline}
                className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-md text-xs font-semibold hover:bg-cyan-500/30 disabled:opacity-50 transition-all shadow-glowCyan"
              >
                <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
                <span>Sync ({offlineQueueCount})</span>
              </button>
            )}
          </div>

          {/* Pre-approved Judge Account Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 pl-2.5 pr-2 py-1 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-xs transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <div className="text-left hidden sm:block">
                <p className="font-semibold text-white leading-tight">{user.name.split(" ")[0]}</p>
                <p className="text-[10px] text-cyan-400">{user.role.replace("_", " ")}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 glass-panel-glow rounded-xl p-2 z-50 border border-cyan-500/30 text-xs shadow-2xl">
                <div className="px-2 py-1.5 border-b border-slate-700/60 mb-1">
                  <p className="font-bold text-white uppercase text-[10px] tracking-wider text-slate-400">
                    Switch Judge Role (Verified RBAC)
                  </p>
                </div>
                {judgeAccounts.map((acc) => (
                  <button
                    key={acc.key}
                    onClick={() => {
                      setUser(
                        {
                          uid: acc.key,
                          name: acc.name,
                          email: acc.email,
                          role: acc.role,
                          state: acc.state,
                          district: acc.district,
                          facility_id: acc.facility_id
                        },
                        acc.key
                      );
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-start justify-between ${
                      user.role === acc.role && user.name === acc.name
                        ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40"
                        : "hover:bg-slate-800/70 text-slate-300"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{acc.name}</p>
                      <p className="text-[10px] text-cyan-400 font-mono">{acc.role}</p>
                      <p className="text-[10px] text-slate-400">{acc.scope}</p>
                    </div>
                    {user.role === acc.role && user.name === acc.name && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncNotice && (
        <div className="bg-cyan-950/80 border-t border-cyan-500/30 text-cyan-200 text-xs px-4 py-1.5 text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-panel border-b border-slate-800 p-4 space-y-2">
          <Link
            href="/district"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md hover:bg-slate-800 text-sm font-medium"
          >
            {t.districtConsole}
          </Link>
          <Link
            href="/facility"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md hover:bg-slate-800 text-sm font-medium"
          >
            {t.facilityConsole}
          </Link>
          <Link
            href="/national"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md hover:bg-slate-800 text-sm font-medium"
          >
            {t.nationalMap}
          </Link>
          <Link
            href="/forecast"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md hover:bg-slate-800 text-sm font-medium"
          >
            {t.forecastLab}
          </Link>
          <Link
            href="/federation"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md hover:bg-slate-800 text-sm font-medium"
          >
            {t.federationHub}
          </Link>
          <Link
            href="/copilot"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md hover:bg-slate-800 text-sm font-medium"
          >
            {t.copilot}
          </Link>
          <Link
            href="/audit"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md hover:bg-slate-800 text-sm font-medium"
          >
            {t.auditForensics}
          </Link>
          <Link
            href="/demo"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md bg-amber-500/20 text-amber-300 font-medium"
          >
            {t.demoPanel}
          </Link>
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2 rounded-md bg-cyan-500/20 text-cyan-300 text-xs font-bold"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2 rounded-md bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Enroll Node
            </Link>
          </div>
        </div>
      )}

    </header>
  );
}
