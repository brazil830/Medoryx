"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { soundFx } from "@/lib/audio";
import { Truck, Activity, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface District3DSceneProps {
  onSelectFacility?: (facId: string) => void;
  activeRecommendation?: boolean;
}

const DISTRICT_FACILITIES = [
  {
    id: "FAC-TN-KAN-001",
    name: "PHC Anakaputhur",
    status: "RED",
    stockText: "4 Packs (Imminent Risk)",
    pos: [-8, 4, 1.2],
    color: 0xef4444,
  },
  {
    id: "FAC-TN-KAN-002",
    name: "PHC Chromepet",
    status: "GREEN",
    stockText: "320 Packs (+200 Surplus)",
    pos: [6, 2, 1.0],
    color: 0x10b981,
  },
  {
    id: "FAC-TN-KAN-003",
    name: "CHC Sriperumbudur",
    status: "GREEN",
    stockText: "180 Packs (Nominal)",
    pos: [-4, -6, 0.8],
    color: 0x10b981,
  },
  {
    id: "FAC-TN-KAN-004",
    name: "PHC Walajabad",
    status: "AMBER",
    stockText: "38 Packs (Buffer Alert)",
    pos: [8, -5, 0.9],
    color: 0xf59e0b,
  },
  {
    id: "FAC-TN-KAN-005",
    name: "PHC Uthiramerur",
    status: "GREEN",
    stockText: "115 Packs (Nominal)",
    pos: [1, -9, 0.7],
    color: 0x10b981,
  },
];

export default function District3DScene({
  onSelectFacility,
  activeRecommendation = true,
}: District3DSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredFacility, setHoveredFacility] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 700;
    const height = container.clientHeight || 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040814, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -18, 26);
    camera.lookAt(0, -1, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0x1e293b, 1.6);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0x06b6d4, 2.4);
    keyLight.position.set(15, 20, 25);
    scene.add(keyLight);

    // District Spatial Topography Ground
    const grid = new THREE.GridHelper(36, 18, 0x06b6d4, 0x0f2147);
    grid.position.set(0, -1, 0);
    grid.rotation.x = Math.PI / 2.2;
    scene.add(grid);

    // Facilities Meshes
    const facMeshes: { mesh: THREE.Mesh; id: string; name: string; ring: THREE.Mesh }[] = [];

    DISTRICT_FACILITIES.forEach((fac) => {
      const geo = new THREE.CylinderGeometry(1.0, 1.3, 2.2, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: fac.color,
        emissive: fac.color,
        emissiveIntensity: 0.6,
        roughness: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(fac.pos[0], fac.pos[1], fac.pos[2]);
      (mesh as any).facId = fac.id;
      scene.add(mesh);

      // Orbital Ring
      const ringGeo = new THREE.RingGeometry(1.6, 1.9, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: fac.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 1.2;
      mesh.add(ringMesh);

      // Beacon for Anakaputhur (RED Deficit)
      if (fac.status === "RED") {
        const beaconGeo = new THREE.CylinderGeometry(0.1, 0.3, 6, 12);
        beaconGeo.translate(0, 3, 0);
        beaconGeo.rotateX(Math.PI / 2);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          transparent: true,
          opacity: 0.45,
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        mesh.add(beacon);
      }

      facMeshes.push({ mesh, id: fac.id, name: fac.name, ring: ringMesh });
    });

    // Active Redistribution Arc: Chromepet -> Anakaputhur
    const chromepet = DISTRICT_FACILITIES[1];
    const anakaputhur = DISTRICT_FACILITIES[0];

    const p1 = new THREE.Vector3(chromepet.pos[0], chromepet.pos[1], chromepet.pos[2] + 1);
    const p3 = new THREE.Vector3(anakaputhur.pos[0], anakaputhur.pos[1], anakaputhur.pos[2] + 1);
    const mid = new THREE.Vector3().addVectors(p1, p3).multiplyScalar(0.5);
    mid.z += 4.5;

    const arcCurve = new THREE.QuadraticBezierCurve3(p1, mid, p3);
    const points = arcCurve.getPoints(40);
    const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
    const arcMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.85,
    });
    const arcLine = new THREE.Line(arcGeo, arcMat);
    scene.add(arcLine);

    // Moving Supply Cargo Capsule
    const packetGeo = new THREE.BoxGeometry(0.8, 0.5, 0.4);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const packetMesh = new THREE.Mesh(packetGeo, packetMat);
    scene.add(packetMesh);

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / height) * 2 - 1);

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(facMeshes.map((f) => f.mesh));
      if (hits.length > 0) {
        const facId = (hits[0].object as any).facId as string;
        setHoveredFacility(facId);
        container.style.cursor = "pointer";
      } else {
        setHoveredFacility(null);
        container.style.cursor = "default";
      }
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(facMeshes.map((f) => f.mesh));
      if (hits.length > 0) {
        const facId = (hits[0].object as any).facId as string;
        soundFx.playClick();
        onSelectFacility?.(facId);
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

      // Traveling cargo packet
      const progress = (elapsed * 0.45) % 1;
      const pt = arcCurve.getPoint(progress);
      packetMesh.position.copy(pt);

      // Rings rotation
      facMeshes.forEach((item, idx) => {
        item.ring.rotation.z += 0.02;
        if (item.id === "FAC-TN-KAN-001") {
          const s = 1 + Math.sin(elapsed * 4.5) * 0.15;
          item.mesh.scale.set(s, s, s);
        }
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
  }, [onSelectFacility]);

  return (
    <div className="relative w-full h-[420px] rounded-xl border border-cyan-500/25 glass-panel-glow overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full" />

      {/* Top Banner */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-2">
        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
          3D DISTRICT OPERATIONS ROOM • KANCHIPURAM
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md animate-pulse">
          1 CRITICAL DEFICIT PULSING
        </span>
      </div>

      {/* Active Transfer Callout */}
      <div className="absolute bottom-3 left-3 z-10 glass-panel-glow border border-cyan-500/40 rounded-lg p-2.5 text-xs flex items-center gap-2.5 backdrop-blur-md">
        <Truck className="w-4 h-4 text-cyan-400 animate-pulse" />
        <div>
          <p className="font-bold text-white text-[11px]">Active Redistribution Arc: Chromepet &rarr; Anakaputhur</p>
          <p className="text-[10px] text-slate-300 font-mono">12 km &bull; 120 Packs &bull; ETA 12.4h &bull; INR 280 Courier</p>
        </div>
      </div>
    </div>
  );
}
