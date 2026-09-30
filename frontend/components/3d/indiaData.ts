/**
 * India Geographic & Facility Telemetry Model for 3D Spatial Visualizations.
 * Normalized coordinates for 3D projection [X: East-West, Y: North-South, Z: Elevation].
 */

export interface FacilityNode3D {
  id: string;
  name: string;
  type: "PHC" | "CHC" | "DISTRICT_HOSPITAL" | "WAREHOUSE" | "HQ";
  state: string;
  district: string;
  pos: [number, number, number]; // [x, y, z]
  status: "GREEN" | "AMBER" | "RED" | "CYAN";
  statusText: string;
  currentStock: number;
  bufferDays: number;
  riskProbability: number;
  drugSku: string;
}

export interface SupplyRoute3D {
  id: string;
  sourceId: string;
  targetId: string;
  type: "REDISTRIBUTION" | "REPLENISHMENT" | "FEDERATION";
  status: "ACTIVE" | "PENDING" | "COMPLETED";
  color: number;
  speed: number;
  label: string;
}

export interface StateRegion3D {
  name: string;
  code: string;
  center: [number, number, number];
  cameraPos: [number, number, number];
  zoomLevel: number;
  resilienceScore: number;
  riskLevel: "CRITICAL" | "MODERATE" | "LOW";
  activeFacilities: number;
}

// State Centroids & Camera Target Points
export const STATE_REGIONS: StateRegion3D[] = [
  {
    name: "Tamil Nadu",
    code: "TN",
    center: [5, -16, 2],
    cameraPos: [5, -16, 35],
    zoomLevel: 2.2,
    resilienceScore: 92,
    riskLevel: "CRITICAL",
    activeFacilities: 24,
  },
  {
    name: "Maharashtra",
    code: "MH",
    center: [-8, -2, 2],
    cameraPos: [-8, -2, 40],
    zoomLevel: 2.0,
    resilienceScore: 88,
    riskLevel: "MODERATE",
    activeFacilities: 18,
  },
  {
    name: "Uttar Pradesh",
    code: "UP",
    center: [7, 10, 1],
    cameraPos: [7, 10, 42],
    zoomLevel: 1.9,
    resilienceScore: 84,
    riskLevel: "MODERATE",
    activeFacilities: 22,
  },
  {
    name: "Rajasthan",
    code: "RJ",
    center: [-10, 10, 1],
    cameraPos: [-10, 10, 42],
    zoomLevel: 1.9,
    resilienceScore: 86,
    riskLevel: "MODERATE",
    activeFacilities: 14,
  },
  {
    name: "Assam",
    code: "AS",
    center: [23, 11, 0],
    cameraPos: [23, 11, 38],
    zoomLevel: 2.1,
    resilienceScore: 79,
    riskLevel: "CRITICAL",
    activeFacilities: 10,
  },
  {
    name: "Kerala",
    code: "KL",
    center: [-2, -23, 1],
    cameraPos: [-2, -23, 35],
    zoomLevel: 2.3,
    resilienceScore: 95,
    riskLevel: "LOW",
    activeFacilities: 12,
  },
];

// India Outline Vertices for 3D Polygon Extrusion & Wireframe Contours
// Approximate boundary points centered around Central India (0, 0)
export const INDIA_BOUNDARY_COORDS: [number, number][] = [
  // North (Kashmir, Ladakh, Himachal)
  [-3, 26], [0, 27], [4, 25], [7, 23], [9, 19],
  // Northeast (Nepal border, Sikkim, Bhutan, Arunachal, Assam)
  [14, 16], [18, 16], [23, 17], [28, 16], [28, 13], [24, 11], [22, 8],
  // East (West Bengal, Odisha, Andhra coast)
  [17, 7], [16, 2], [14, -3], [11, -9], [8, -14],
  // South (Tamil Nadu, Kanyakumari, Kerala)
  [6, -18], [4, -22], [1, -26], [-1, -25], [-3, -22], [-4, -18],
  // West (Karnataka, Goa, Maharashtra, Gujarat)
  [-7, -14], [-8, -10], [-9, -4], [-12, -1], [-15, 3], [-18, 5], [-16, 8], [-12, 9],
  // Northwest (Rajasthan, Punjab, Haryana)
  [-13, 14], [-10, 18], [-7, 21], [-5, 24]
];

// Healthcare Facility Nodes
export const FACILITY_NODES: FacilityNode3D[] = [
  // National HQ
  {
    id: "HQ-DELHI-001",
    name: "National Health Command Center (HQ)",
    type: "HQ",
    state: "Delhi",
    district: "New Delhi",
    pos: [0, 15, 3.5],
    status: "CYAN",
    statusText: "Operational",
    currentStock: 45000,
    bufferDays: 45,
    riskProbability: 0.01,
    drugSku: "DRUG-AL-01",
  },

  // Tamil Nadu Cluster (Focal district: Kanchipuram)
  {
    id: "FAC-TN-KAN-001",
    name: "PHC Anakaputhur (Deficit Node)",
    type: "PHC",
    state: "Tamil Nadu",
    district: "Kanchipuram",
    pos: [5, -16.2, 2.2],
    status: "RED",
    statusText: "Stock-Out Imminent (18h)",
    currentStock: 4,
    bufferDays: 0.8,
    riskProbability: 0.94,
    drugSku: "Artemether + Lumefantrine",
  },
  {
    id: "FAC-TN-KAN-002",
    name: "PHC Chromepet (Surplus Hub)",
    type: "PHC",
    state: "Tamil Nadu",
    district: "Kanchipuram",
    pos: [7.2, -15.1, 1.8],
    status: "GREEN",
    statusText: "Surplus +200 packs",
    currentStock: 320,
    bufferDays: 28,
    riskProbability: 0.02,
    drugSku: "Artemether + Lumefantrine",
  },
  {
    id: "FAC-TN-KAN-003",
    name: "CHC Sriperumbudur",
    type: "CHC",
    state: "Tamil Nadu",
    district: "Kanchipuram",
    pos: [3.8, -15.5, 1.5],
    status: "GREEN",
    statusText: "Nominal Supply",
    currentStock: 180,
    bufferDays: 19,
    riskProbability: 0.05,
    drugSku: "Artemether + Lumefantrine",
  },
  {
    id: "FAC-TN-CHE-001",
    name: "Chennai District Hospital (DH)",
    type: "DISTRICT_HOSPITAL",
    state: "Tamil Nadu",
    district: "Chennai",
    pos: [8.5, -13.5, 2.5],
    status: "CYAN",
    statusText: "Regional Reserve Base",
    currentStock: 2400,
    bufferDays: 32,
    riskProbability: 0.01,
    drugSku: "Artemether + Lumefantrine",
  },

  // Maharashtra Cluster
  {
    id: "FAC-MH-MUM-001",
    name: "Mumbai Central Medical Depot",
    type: "WAREHOUSE",
    state: "Maharashtra",
    district: "Mumbai",
    pos: [-11, -1.2, 2.4],
    status: "CYAN",
    statusText: "Primary Western Depot",
    currentStock: 12000,
    bufferDays: 40,
    riskProbability: 0.02,
    drugSku: "Multi-SKU Reserve",
  },
  {
    id: "FAC-MH-PUN-001",
    name: "Pune CHC Cluster",
    type: "CHC",
    state: "Maharashtra",
    district: "Pune",
    pos: [-7.2, -3.4, 2.0],
    status: "GREEN",
    statusText: "Nominal Supply",
    currentStock: 410,
    bufferDays: 22,
    riskProbability: 0.04,
    drugSku: "Artemether + Lumefantrine",
  },

  // Uttar Pradesh Cluster
  {
    id: "FAC-UP-LUC-001",
    name: "Lucknow Regional Health Depot",
    type: "DISTRICT_HOSPITAL",
    state: "Uttar Pradesh",
    district: "Lucknow",
    pos: [5.8, 12.2, 1.8],
    status: "GREEN",
    statusText: "Nominal Supply",
    currentStock: 820,
    bufferDays: 24,
    riskProbability: 0.03,
    drugSku: "Artemether + Lumefantrine",
  },
  {
    id: "FAC-UP-VAR-001",
    name: "Varanasi PHC (Surge Watch)",
    type: "PHC",
    state: "Uttar Pradesh",
    district: "Varanasi",
    pos: [11.2, 8.4, 1.4],
    status: "AMBER",
    statusText: "Surge Watch (4.2d buffer)",
    currentStock: 28,
    bufferDays: 4.2,
    riskProbability: 0.48,
    drugSku: "Artemether + Lumefantrine",
  },

  // Rajasthan Cluster
  {
    id: "FAC-RJ-JAI-001",
    name: "Jaipur District Hospital",
    type: "DISTRICT_HOSPITAL",
    state: "Rajasthan",
    district: "Jaipur",
    pos: [-8.2, 11.1, 1.7],
    status: "GREEN",
    statusText: "Nominal Supply",
    currentStock: 650,
    bufferDays: 26,
    riskProbability: 0.02,
    drugSku: "Artemether + Lumefantrine",
  },
  {
    id: "FAC-RJ-JOD-001",
    name: "Jodhpur Desert CHC",
    type: "CHC",
    state: "Rajasthan",
    district: "Jodhpur",
    pos: [-14.1, 8.9, 1.3],
    status: "AMBER",
    statusText: "Replenishment Scheduled",
    currentStock: 42,
    bufferDays: 5.1,
    riskProbability: 0.38,
    drugSku: "Artemether + Lumefantrine",
  },

  // Assam Cluster
  {
    id: "FAC-AS-KAM-001",
    name: "Kamrup District Hospital",
    type: "DISTRICT_HOSPITAL",
    state: "Assam",
    district: "Kamrup",
    pos: [22.4, 11.2, 1.5],
    status: "GREEN",
    statusText: "Northeast Logistics Gateway",
    currentStock: 530,
    bufferDays: 21,
    riskProbability: 0.06,
    drugSku: "Artemether + Lumefantrine",
  },
  {
    id: "FAC-AS-DIB-001",
    name: "Dibrugarh PHC Outpost",
    type: "PHC",
    state: "Assam",
    district: "Dibrugarh",
    pos: [26.8, 14.2, 1.2],
    status: "AMBER",
    statusText: "Monsoon Surge Vulnerable",
    currentStock: 19,
    bufferDays: 3.5,
    riskProbability: 0.62,
    drugSku: "Artemether + Lumefantrine",
  },

  // Kerala Cluster
  {
    id: "FAC-KL-TVM-001",
    name: "Thiruvananthapuram DH",
    type: "DISTRICT_HOSPITAL",
    state: "Kerala",
    district: "Thiruvananthapuram",
    pos: [-1.2, -24.8, 1.6],
    status: "GREEN",
    statusText: "High Resilience (96%)",
    currentStock: 740,
    bufferDays: 30,
    riskProbability: 0.01,
    drugSku: "Artemether + Lumefantrine",
  },
  {
    id: "FAC-KL-EKM-001",
    name: "Ernakulam CHC",
    type: "CHC",
    state: "Kerala",
    district: "Ernakulam",
    pos: [-3.1, -21.5, 1.4],
    status: "GREEN",
    statusText: "Optimal Level",
    currentStock: 380,
    bufferDays: 25,
    riskProbability: 0.02,
    drugSku: "Artemether + Lumefantrine",
  },
];

// Active Supply Routes & Bezier Logistics Arcs
export const SUPPLY_ROUTES: SupplyRoute3D[] = [
  {
    id: "ROUTE-TN-MILP-01",
    sourceId: "FAC-TN-KAN-002", // Chromepet (Surplus)
    targetId: "FAC-TN-KAN-001", // Anakaputhur (Deficit)
    type: "REDISTRIBUTION",
    status: "ACTIVE",
    color: 0x06b6d4, // Cyan
    speed: 1.4,
    label: "MILP Optimization Arc: 120 Packs Transfer (PuLP CBC Solved)",
  },
  {
    id: "ROUTE-TN-DH-01",
    sourceId: "FAC-TN-CHE-001", // Chennai DH
    targetId: "FAC-TN-KAN-002", // Chromepet
    type: "REPLENISHMENT",
    status: "PENDING",
    color: 0x10b981, // Green
    speed: 0.8,
    label: "District Hospital Buffer Replenishment",
  },
  {
    id: "ROUTE-DEL-HQ-01",
    sourceId: "HQ-DELHI-001",
    targetId: "FAC-TN-CHE-001",
    type: "FEDERATION",
    status: "ACTIVE",
    color: 0x3b82f6, // Blue
    speed: 0.6,
    label: "National BigQuery Telemetry Stream",
  },
  {
    id: "ROUTE-MH-FED-01",
    sourceId: "HQ-DELHI-001",
    targetId: "FAC-MH-MUM-001",
    type: "FEDERATION",
    status: "ACTIVE",
    color: 0x8b5cf6, // Purple
    speed: 0.7,
    label: "Western Hub Model Weights Sync",
  },
];
