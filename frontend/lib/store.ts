/**
 * Zustand global UI state store for MedOryx-India.
 * Manages operational session, active selections, offline flags, and language preferences.
 * Does NOT act as authoritative inventory store.
 */

import { create } from "zustand";

export interface UserSession {
  uid: string;
  name: string;
  email: string;
  role: "PHC_OPERATOR" | "DISTRICT_OFFICER" | "STATE_DIRECTOR" | "FEDERATION_ADMIN";
  state: string | null;
  district: string | null;
  facility_id: string | null;
}

interface AppState {
  user: UserSession;
  token: string;
  language: "en" | "ta" | "hi";
  isOffline: boolean;
  offlineQueueCount: number;
  activeDistrict: string;
  activeFacilityId: string;
  demoScenario: string;
  outbreakActive: boolean;

  // Actions
  setUser: (user: UserSession, token: string) => void;
  setLanguage: (lang: "en" | "ta" | "hi") => void;
  setIsOffline: (offline: boolean) => void;
  setOfflineQueueCount: (count: number) => void;
  setActiveDistrict: (district: string) => void;
  setActiveFacilityId: (facId: string) => void;
  setDemoScenario: (scenario: string, outbreak: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: {
    uid: "usr_dmo_01",
    name: "Dr. S. Kanchana (DMO)",
    email: "dmo.kanchipuram@medoryx.gov.in",
    role: "DISTRICT_OFFICER",
    state: "Tamil Nadu",
    district: "Kanchipuram",
    facility_id: null,
  },
  token: "dmo_kanchipuram",
  language: "en",
  isOffline: false,
  offlineQueueCount: 0,
  activeDistrict: "Kanchipuram",
  activeFacilityId: "FAC-TN-KAN-001",
  demoScenario: "BASELINE",
  outbreakActive: false,

  setUser: (user, token) => set({ user, token }),
  setLanguage: (language) => set({ language }),
  setIsOffline: (isOffline) => set({ isOffline }),
  setOfflineQueueCount: (offlineQueueCount) => set({ offlineQueueCount }),
  setActiveDistrict: (activeDistrict) => set({ activeDistrict }),
  setActiveFacilityId: (activeFacilityId) => set({ activeFacilityId }),
  setDemoScenario: (demoScenario, outbreakActive) => set({ demoScenario, outbreakActive }),
}));
