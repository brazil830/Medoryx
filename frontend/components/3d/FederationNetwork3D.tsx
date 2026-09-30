"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { soundFx } from "@/lib/audio";
import {
  Globe,
  ShieldCheck,
  Lock,
  Play,
  RefreshCw,
  Cpu,
  Layers,
  CheckCircle2,
} from "lucide-react";

interface FedNode {
  id: string;
  name: string;
  country: string;
  role: string;
  pos: [number, number, number];
  color: number;
  localSamples: number;
  epsilon: number;
  status: string;
}

const FED_NODES: FedNode[] = [
  {
    id: "NODE-IN",
    name: "India National Health Edge (CMSS / NIC)",
    country: "India",
    role: "Global Coordinator & Model Aggregator",
    pos: [0, 2, 4],
    color: 0x06b6d4, // Cyan
    localSamples: 42000,
    epsilon: 2.14,
    status: "AGGREGATING",
  },
  {
    id: "NODE-BR",
    name: "Brazil Fiocruz Epidemiological Edge",
    country: "Brazil",
    role: "Latin America Cross-Validation Node",
    pos: [-14, -6, -2],
    color: 0x10b981, // Emerald
    localSamples: 18500,
    epsilon: 2.85,
    status: "LOCAL_TRAIN_COMPLETE",
  },
  {
    id: "NODE-ZA",
    name: "South Africa NHLS Surveillance Hub",
    country: "South Africa",
    role: "Sub-Saharan Vector Sentinel",
    pos: [-4, -12, 1],
    color: 0x8b5cf6, // Purple
    localSamples: 12200,
    epsilon: 2.45,
    status: "STANDBY",
  },
  {
    id: "NODE-RU",
    name: "Eurasian Medical Logistics Node",
    country: "Russia",
    role: "Cold-Chain Logistics Observer",
    pos: [12, 11, -3],
    color: 0x3b82f6, // Blue
    localSamples: 15400,
    epsilon: 2.92,
    status: "STANDBY",
  },
  {
    id: "NODE-CN",
    name: "East Asia Supply Corridor Node",
    country: "China",
    role: "API Integration Gateway",
    pos: [16, 1, -1],
    color: 0xf59e0b, // Amber
    localSamples: 31000,
    epsilon: 2.78,
    status: "STANDBY",
  },
];

interface FederationNetwork3DProps {
  onTriggerRound?: () => void;
  isRunningRound?: boolean;
}

export default function FederationNetwork3D({
  onTriggerRound,
  isRunningRound = false,
}: FederationNetwork3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<FedNode>(FED_NODES[0]);
  const [isAnimatingRound, setIsAnimatingRound] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 42);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0x1e293b, 1.5);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0x06b6d4, 2.2);
    keyLight.position.set(20, 20, 30);
    scene.add(keyLight);

    // Cryptographic Privacy Shield Globe
    const globeGeo = new THREE.SphereGeometry(18, 32, 32);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x0a183d,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const privacyGlobe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(privacyGlobe);

    // Orbit Ring
    const orbitGeo = new THREE.RingGeometry(18, 18.2, 64);
    const orbitMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);
    orbitMesh.rotation.x = Math.PI / 2.5;
    scene.add(orbitMesh);

    // Nodes
    const nodeMeshes: { mesh: THREE.Mesh; node: FedNode; shield: THREE.Mesh }[] = [];

    FED_NODES.forEach((node) => {
      const coreGeo = new THREE.SphereGeometry(1.6, 20, 20);
      const coreMat = new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(node.pos[0], node.pos[1], node.pos[2]);
      (core as any).nodeData = node;
      scene.add(core);

      // Differential Privacy Noise Shell
      const shieldGeo = new THREE.IcosahedronGeometry(2.4, 1);
      const shieldMat = new THREE.MeshBasicMaterial({
        color: node.color,
        wireframe: true,
        transparent: true,
        opacity: 0.45,
      });
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      core.add(shield);

      nodeMeshes.push({ mesh: core, node, shield });
    });

    // Encrypted Tensor Arcs connecting non-coordinator nodes to coordinator (India)
    const coordinatorPos = new THREE.Vector3(FED_NODES[0].pos[0], FED_NODES[0].pos[1], FED_NODES[0].pos[2]);
    const tensorArcs: { curve: THREE.QuadraticBezierCurve3; packet: THREE.Mesh; speed: number }[] = [];

    for (let i = 1; i < FED_NODES.length; i++) {
      const srcNode = FED_NODES[i];
      const p1 = new THREE.Vector3(srcNode.pos[0], srcNode.pos[1], srcNode.pos[2]);
      const p3 = coordinatorPos;
      const mid = new THREE.Vector3().addVectors(p1, p3).multiplyScalar(0.5);
      mid.z += 5; // Elevated geodesic

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p3);
      const points = curve.getPoints(36);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.65,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      // Model weight packet
      const packetGeo = new THREE.SphereGeometry(0.5, 12, 12);
      const packetMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
      const packetMesh = new THREE.Mesh(packetGeo, packetMat);
      scene.add(packetMesh);

      tensorArcs.push({ curve, packet: packetMesh, speed: 0.5 + i * 0.15 });
    }

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / height) * 2 - 1);

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(nodeMeshes.map((n) => n.mesh));
      if (hits.length > 0) {
        container.style.cursor = "pointer";
      } else {
        container.style.cursor = "default";
      }
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(nodeMeshes.map((n) => n.mesh));
      if (hits.length > 0) {
        const hitNode = (hits[0].object as any).nodeData as FedNode;
        soundFx.playClick();
        setSelectedNode(hitNode);
      }
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("click", onClick);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Rotate privacy globe
      privacyGlobe.rotation.y = elapsed * 0.05;
      privacyGlobe.rotation.x = elapsed * 0.02;

      // Animate tensor weight packets
      tensorArcs.forEach((item, idx) => {
        const speed = isRunningRound || isAnimatingRound ? item.speed * 2.5 : item.speed;
        const progress = (elapsed * speed + idx * 0.25) % 1;
        const pt = item.curve.getPoint(progress);
        item.packet.position.copy(pt);
      });

      // Shield pulse
      nodeMeshes.forEach((item, idx) => {
        item.shield.rotation.y = elapsed * 0.5 + idx;
        item.shield.rotation.z = elapsed * 0.3;
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
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("click", onClick);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isRunningRound, isAnimatingRound]);

  const handleSimulateRound = () => {
    soundFx.playAffirm();
    setIsAnimatingRound(true);
    onTriggerRound?.();
    setTimeout(() => {
      setIsAnimatingRound(false);
    }, 4000);
  };

  return (
    <div className="relative w-full h-[540px] rounded-2xl border border-purple-500/30 glass-panel-glow overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full" />

      {/* Top Header Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 backdrop-blur-md">
            BRICS PRIVACY-PRESERVING FEDERATION MESH
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
            OPACUS DP: &epsilon; &le; 3.0 (&delta;=10⁻⁵)
          </span>
        </div>
        <p className="text-[11px] text-slate-400 font-mono mt-1">
          DATA STAYS LOCAL • MODEL KNOWLEDGE MOVES
        </p>
      </div>

      {/* Top Right: Trigger Federated Training Round */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={handleSimulateRound}
          disabled={isRunningRound || isAnimatingRound}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs font-mono shadow-glowCyan transition-all disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${isAnimatingRound || isRunningRound ? "animate-spin" : ""}`} />
          <span>{isAnimatingRound || isRunningRound ? "Syncing Weights..." : "Execute FedProx Round"}</span>
        </button>
      </div>

      {/* Selected Node Telemetry Drawer */}
      <div className="absolute bottom-4 left-4 right-4 z-10 glass-panel-glow border border-purple-500/40 p-4 rounded-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h4 className="font-bold text-sm text-white">{selectedNode.name}</h4>
              <span className="text-xs text-purple-300 font-mono">[{selectedNode.country}]</span>
            </div>
            <p className="text-xs text-slate-300">{selectedNode.role}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center shrink-0">
            <div className="px-3 py-1.5 bg-slate-900/70 rounded-lg border border-slate-800">
              <span className="text-[9px] uppercase text-slate-400 block">Local Training Rows</span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {selectedNode.localSamples.toLocaleString()}
              </span>
            </div>
            <div className="px-3 py-1.5 bg-slate-900/70 rounded-lg border border-slate-800">
              <span className="text-[9px] uppercase text-slate-400 block">Privacy Loss (&epsilon;)</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {selectedNode.epsilon}
              </span>
            </div>
            <div className="px-3 py-1.5 bg-slate-900/70 rounded-lg border border-slate-800">
              <span className="text-[9px] uppercase text-slate-400 block">Node State</span>
              <span className="text-xs font-mono font-bold text-purple-300">
                {selectedNode.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
