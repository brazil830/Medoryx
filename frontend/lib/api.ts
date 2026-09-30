/**
 * Typed API Client for MedOryx-India Platform.
 * Communicates with FastAPI backend. All state mutations and calculations occur server-side.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(endpoint: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData?.detail?.error?.message || errorData?.detail || `HTTP Error ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err: any) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  login: (accountKey: string = "dmo_kanchipuram") =>
    request<any>(`/auth/login?account_key=${accountKey}`, { method: "POST" }),
  getMe: (token: string) =>
    request<any>("/auth/me", {}, token),

  // Inventory & Sync
  getFacilityInventory: (facilityId: string, token: string) =>
    request<any>(`/inventory/facility/${facilityId}`, {}, token),
  syncInventory: (payload: any, token: string) =>
    request<any>("/api/v1/inventory/sync", { method: "POST", body: JSON.stringify(payload) }, token),

  // Optimization & Recommendations
  runRedistribution: (district: string = "Kanchipuram", drugId: string = "DRUG-AL-01", token: string) =>
    request<any>(`/optimization/redistribute?district=${encodeURIComponent(district)}&drug_id=${drugId}`, { method: "POST" }, token),
  getRecommendations: (district: string = "Kanchipuram", status?: string, token?: string) => {
    let url = `/optimization/recommendations?district=${encodeURIComponent(district)}`;
    if (status) url += `&status=${status}`;
    return request<any>(url, {}, token);
  },
  approveRecommendation: (id: string, adjustedQuantity: number | null, token: string) =>
    request<any>(`/optimization/recommendations/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ adjusted_quantity: adjustedQuantity }),
    }, token),
  rejectRecommendation: (id: string, reason: string, notes: string | null, token: string) =>
    request<any>(`/optimization/recommendations/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejection_reason: reason, rejection_notes: notes }),
    }, token),
  dispatchRecommendation: (id: string, token: string) =>
    request<any>(`/optimization/recommendations/${id}/dispatch`, { method: "POST" }, token),
  receiveRecommendation: (id: string, token: string) =>
    request<any>(`/optimization/recommendations/${id}/receive`, { method: "POST" }, token),

  // Analytics
  getFacilityForecast: (facilityId: string, token?: string) =>
    request<any>(`/analytics/forecast/${facilityId}`, {}, token),
  getAlerts: (token?: string) =>
    request<any>("/analytics/alerts", {}, token),
  getNationalOverview: (token?: string) =>
    request<any>("/analytics/national", {}, token),
  checkAnomaly: (payload: any, token?: string) =>
    request<any>("/analytics/check-anomaly", { method: "POST", body: JSON.stringify(payload) }, token),

  // Federation
  getFederationStatus: (token?: string) =>
    request<any>("/federation/global-model", {}, token),
  runFederatedRound: (token?: string) =>
    request<any>("/federation/run-round", { method: "POST" }, token),

  // AI Engine
  explainRecommendation: (payload: any, token?: string) =>
    request<any>("/ai/explain", { method: "POST", body: JSON.stringify(payload) }, token),
  queryCopilot: (query: string, language: string = "en", token?: string) =>
    request<any>("/ai/copilot", { method: "POST", body: JSON.stringify({ query, language }) }, token),
  parseVoice: (transcript: string) => {
    const formData = new FormData();
    formData.append("transcript", transcript);
    return fetch(`${API_BASE}/ai/voice/parse`, { method: "POST", body: formData }).then((r) => r.json());
  },
  extractVision: (filename: string = "medicine_box.jpg") => {
    const formData = new FormData();
    formData.append("filename", filename);
    return fetch(`${API_BASE}/ai/vision/extract`, { method: "POST", body: formData }).then((r) => r.json());
  },

  // Audit
  getAuditLogs: (filters: { role?: string; action?: string; search?: string } = {}, token?: string) => {
    const params = new URLSearchParams();
    if (filters.role) params.set("role", filters.role);
    if (filters.action) params.set("action", filters.action);
    if (filters.search) params.set("search", filters.search);
    return request<any>(`/audit/logs?${params.toString()}`, {}, token);
  },
  getAuditCsvUrl: () => `${API_BASE}/audit/export-csv`,

  // Demo Controls
  getDemoStatus: (token?: string) =>
    request<any>("/demo/status", {}, token),
  triggerScenario: (payload: any, token?: string) =>
    request<any>("/demo/scenario", { method: "POST", body: JSON.stringify(payload) }, token),
  resetBaseline: (token?: string) =>
    request<any>("/demo/reset", { method: "POST" }, token),

  // System Health
  getSystemHealth: () =>
    request<any>("/health"),
};
