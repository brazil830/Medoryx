"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { soundFx } from "@/lib/audio";
import {
  Building2,
  Truck,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Thermometer,
} from "lucide-react";

interface SupplyTier {
  id: string;
  name: string;
  role: string;
  location: string;
  pos: [number, number, number];
  color: number;
  stockPacks: number;
  coldChainTemp: string;
  dispatchLatency: string;
  details: string;
}

const TIERS: SupplyTier[] = [
  {
    id: "TIER-NAT",
    name: "National Central Warehouse (CMSS)",
    role: "Central Reserve & Primary Procurement",
    location: "New Delhi Logistics Gateway",
    pos: [-14, 0, 0],
    color: 0x3b82f6,
    stockPacks: 140000,
    coldChainTemp: "+4.2°C (Compliant)",
    dispatchLatency: "< 48h National Corridor",
    details: "Bulk procurement buffer for 6 Indian states under National Health Mission guidelines.",
  },
  {
    id: "TIER-STATE",
    name: "Tamil Nadu State Depot (TNMSC)",
    role: "State Strategic Redistribution Depot",
    location: "Chennai Hub",
    pos: [-5, 0, 0],
    color: 0x06b6d4,
    stockPacks: 28500,
    coldChainTemp: "+3.8°C (Compliant)",
    dispatchLatency: "< 12h District Arteries",
    details: "Automated warehouse with FEFO batch allocation and BigQuery replica syncing.",
  },
  {
    id: "TIER-DIST",
    name: "Kanchipuram District Logistics Hub",
    role: "District Buffer & MILP Optimization Node",
    location: "Kanchipuram DH",
    pos: [4, 0, 0],
    color: 0x10b981,
    stockPacks: 4200,
    coldChainTemp: "+4.0°C (Compliant)",
    dispatchLatency: "< 3h Intra-District Couriers",
    details: "PuLP CBC solver computes optimal inter-facility routes minimizing INR 100+15/km freight cost.",
  },
  {
    id: "TIER-PHC",
    name: "PHC Anakaputhur Dispensary",
    role: "Last-Mile Point of Dispensation",
    location: "Anakaputhur Village",
    pos: [13, 0, 0],
    color: 0xef4444,
    stockPacks: 4,
    coldChainTemp: "+4.5°C (Vaccine Carrier Active)",
    dispatchLatency: "Immediate Clinical Dispensation",
    details: "Monitored via offline-first IndexedDB logging. Currently undergoing 120-pack emergency transfer.",
  },
];

export default function SupplyChain3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTier, setSelectedTier] = useState<SupplyTier>(TIERS[2]);
  const [isLite, setIsLite] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 700;
    const height = container.clientHeight || 400;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      container.appendChild(renderer.domElement);
    } catch {
      setIsLite(true);
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -10, 32);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x06b6d4, 2.0);
    dirLight.position.set(10, 20, 20);
    scene.add(dirLight);

    // Grid plane
    const grid = new THREE.GridHelper(50, 24, 0x06b6d4, 0x111c38);
    grid.position.set(0, -4, 0);
    scene.add(grid);

    // Tier 3D Buildings/Hubs
    const tierMeshes: { mesh: THREE.Mesh; tier: SupplyTier }[] = [];

    TIERS.forEach((tier) => {
      // 3D Hexagonal / Column Base
      const geo = new THREE.CylinderGeometry(1.8, 2.2, 3.5, 6);
      const mat = new THREE.MeshStandardMaterial({
        color: tier.color,
        emissive: tier.color,
        emissiveIntensity: 0.35,
        roughness: 0.3,
        metalness: 0.6,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(tier.pos[0], tier.pos[1], tier.pos[2]);
      (mesh as any).tierData = tier;
      scene.add(mesh);

      // Top illuminated beacon ring
      const ringGeo = new THREE.RingGeometry(2.3, 2.6, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: tier.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 1.8;
      mesh.add(ringMesh);

      tierMeshes.push({ mesh, tier });
    });

    // Connecting Logistics Arcs between consecutive tiers
    const cargoPackets: { curve: THREE.QuadraticBezierCurve3; packet: THREE.Mesh; speed: number }[] = [];

    for (let i = 0; i < TIERS.length - 1; i++) {
      const t1 = TIERS[i];
      const t2 = TIERS[i + 1];

      const p1 = new THREE.Vector3(t1.pos[0], t1.pos[1], t1.pos[2]);
      const p3 = new THREE.Vector3(t2.pos[0], t2.pos[1], t2.pos[2]);
      const mid = new THREE.Vector3().addVectors(p1, p3).multiplyScalar(0.5);
      mid.y += 3.5; // Arched trajectory

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p3);
      const points = curve.getPoints(30);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.6,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      // Cargo supply capsule
      const capGeo = new THREE.BoxGeometry(0.8, 0.5, 0.5);
      const capMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      scene.add(capMesh);

      cargoPackets.push({ curve, packet: capMesh, speed: 0.4 + i * 0.2 });
    }

    // Interactive Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / height) * 2 - 1);

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(tierMeshes.map((t) => t.mesh));
      if (hits.length > 0) {
        container.style.cursor = "pointer";
      } else {
        container.style.cursor = "default";
      }
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(tierMeshes.map((t) => t.mesh));
      if (hits.length > 0) {
        const hitTier = (hits[0].object as any).tierData as SupplyTier;
        soundFx.playClick();
        setSelectedTier(hitTier);
      }
    };

    container.addEventListener("mousemove", onPointerMove);
    container.addEventListener("click", onClick);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Animate cargo movement along logistics arcs
      cargoPackets.forEach((item, idx) => {
        const progress = (elapsed * item.speed + idx * 0.3) % 1;
        const pt = item.curve.getPoint(progress);
        item.packet.position.copy(pt);
      });

      // Subtle rotation of tier bases
      tierMeshes.forEach((item, idx) => {
        item.mesh.rotation.y = elapsed * 0.3 + idx;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousemove", onPointerMove);
      container.removeEventListener("click", onClick);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[520px] rounded-2xl border border-cyan-500/25 glass-panel-glow overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full" />

      {/* Top Header Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
            END-TO-END SUPPLY CHAIN DIGITAL TWIN
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            NATIONAL &rarr; STATE &rarr; DISTRICT &rarr; LAST-MILE PHC
          </span>
        </div>
      </div>

      {/* Top Right: Tier Quick Switch Buttons */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg p-1 backdrop-blur-md">
        {TIERS.map((tier) => (
          <button
            key={tier.id}
            onClick={() => {
              soundFx.playClick();
              setSelectedTier(tier);
            }}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
              selectedTier.id === tier.id
                ? "bg-cyan-500/30 text-cyan-200 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tier.id.replace("TIER-", "")}
          </button>
        ))}
      </div>

      {/* Selected Tier Context Card */}
      <div className="absolute bottom-4 left-4 right-4 z-10 glass-panel-glow border border-cyan-500/40 p-4 rounded-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor:
                    selectedTier.color === 0xef4444
                      ? "#ef4444"
                      : selectedTier.color === 0x10b981
                      ? "#10b981"
                      : "#06b6d4",
                }}
              />
              <h4 className="font-bold text-sm text-white">{selectedTier.name}</h4>
              <span className="text-xs text-slate-400 font-mono">({selectedTier.location})</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{selectedTier.details}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center shrink-0">
            <div className="px-3 py-1.5 bg-slate-900/70 rounded-lg border border-slate-800">
              <span className="text-[9px] uppercase text-slate-400 block">Stock Reserve</span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {selectedTier.stockPacks.toLocaleString()} Packs
              </span>
            </div>
            <div className="px-3 py-1.5 bg-slate-900/70 rounded-lg border border-slate-800">
              <span className="text-[9px] uppercase text-slate-400 block">Cold Chain</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {selectedTier.coldChainTemp}
              </span>
            </div>
            <div className="px-3 py-1.5 bg-slate-900/70 rounded-lg border border-slate-800">
              <span className="text-[9px] uppercase text-slate-400 block">Dispatch SLA</span>
              <span className="text-xs font-mono font-bold text-amber-300">
                {selectedTier.dispatchLatency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
