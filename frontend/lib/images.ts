/**
 * Public health imagery metadata and SVG fallback visual generators for Indian operational healthcare.
 * Complies with Part H2 of Master Specification.
 */

export interface CarouselSlide {
  id: string;
  title: string;
  caption: string;
  source: string;
  tag: string;
  accent: string;
}

export const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: "phc_rural",
    title: "Rural Primary Health Centre (PHC) — Field Tier",
    caption: "Frontline primary care facility serving 30,000 rural residents in Kanchipuram district with zero cold-chain compromises.",
    source: "National Health Mission (NHM) Tamil Nadu",
    tag: "FRONTLINE CARE",
    accent: "from-emerald-600/30 to-teal-900/40"
  },
  {
    id: "pharmacist_stock",
    title: "Digitized Medicine Dispensary & Stock Registers",
    caption: "Offline-first batch ledger with automated FEFO expiry rotation tracking Artemether-Lumefantrine and Paracetamol.",
    source: "Central Medical Services Society (CMSS) / data.gov.in",
    tag: "BATCH FEFO AUDIT",
    accent: "from-cyan-600/30 to-blue-900/40"
  },
  {
    id: "field_surveillance",
    title: "Epidemic Vector Surveillance & Outbreak Radar",
    caption: "Citizen photo analysis with Gemini multimodal classification detecting stagnant mosquito breeding vectors.",
    source: "National Vector Borne Disease Control Programme (NVBDCP)",
    tag: "OUTBREAK SENSING",
    accent: "from-amber-600/30 to-orange-900/40"
  },
  {
    id: "cold_chain_logistics",
    title: "Inter-Facility Cold Chain & Emergency Redistribution",
    caption: "Automated MILP transport routing calculating exact travel times and INR 100 + 15/km dispatch vouchers.",
    source: "Ministry of Health & Family Welfare (MoHFW)",
    tag: "MILP ROUTING",
    accent: "from-blue-600/30 to-indigo-900/40"
  },
  {
    id: "federated_brics",
    title: "Privacy-Preserving Edge Federation (India & Brazil)",
    caption: "Flower FedProx with Opacus differential privacy ensuring raw clinical ledgers never leave national jurisdiction.",
    source: "BRICS Resilience Initiative / Smart Health Track",
    tag: "FEDERATED DP-SGD",
    accent: "from-purple-600/30 to-slate-900/40"
  }
];
