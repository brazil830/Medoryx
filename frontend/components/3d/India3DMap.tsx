"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import {
  FACILITY_NODES,
  SUPPLY_ROUTES,
  STATE_REGIONS,
  INDIA_BOUNDARY_COORDS,
  FacilityNode3D,
  StateRegion3D,
} from "./indiaData";
import { soundFx } from "@/lib/audio";
import {
  Activity,
  Layers,
  MapPin,
  ShieldAlert,
  ArrowRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface India3DMapProps {
  interactive?: boolean;
  selectedState?: string | null;
  selectedFacilityId?: string | null;
  onSelectFacility?: (fac: FacilityNode3D) => void;
  onSelectState?: (state: StateRegion3D) => void;
  heightClass?: string;
  showHUD?: boolean;
  compactHUD?: boolean;
}

export default function India3DMap({
  interactive = true,
  selectedState = null,
  selectedFacilityId = null,
  onSelectFacility,
  onSelectState,
  heightClass = "h-[620px] lg:h-[720px]",
  showHUD = true,
  compactHUD = false,
}: India3DMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeNode, setActiveNode] = useState<FacilityNode3D | null>(null);
  const [hoveredNode, setHoveredNode] = useState<FacilityNode3D | null>(null);
  const [activeStateRegion, setActiveStateRegion] = useState<StateRegion3D | null>(null);
  const [isLite, setIsLite] = useState(false);
  const [isCameraFocusing, setIsCameraFocusing] = useState(false);

  // References for animation loop
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 78));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, -2, 0));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, -2, 0));

  // Handle state zoom from outside
  useEffect(() => {
    if (selectedState) {
      const region = STATE_REGIONS.find(
        (r) => r.name.toLowerCase() === selectedState.toLowerCase() || r.code === selectedState
      );
      if (region) {
        setActiveStateRegion(region);
        targetCamPos.current.set(region.cameraPos[0], region.cameraPos[1], region.cameraPos[2]);
        targetLookAt.current.set(region.center[0], region.center[1], region.center[2]);
      }
    } else {
      setActiveStateRegion(null);
      targetCamPos.current.set(0, 0, 78);
      targetLookAt.current.set(0, -2, 0);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedFacilityId) {
      const fac = FACILITY_NODES.find((f) => f.id === selectedFacilityId);
      if (fac) {
        setActiveNode(fac);
        targetCamPos.current.set(fac.pos[0] + 4, fac.pos[1] - 4, 30);
        targetLookAt.current.set(fac.pos[0], fac.pos[1], fac.pos[2]);
      }
    }
  }, [selectedFacilityId]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.appendChild(renderer.domElement);
    } catch {
      setIsLite(true);
      return;
    }

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.0075);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 1000);
    camera.position.set(0, -6, 78);
    cameraRef.current = camera;

    // 2. Lighting Environment
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0x22d3ee, 2.2);
    mainKeyLight.position.set(30, 40, 50);
    scene.add(mainKeyLight);

    const secondaryFill = new THREE.DirectionalLight(0x3b82f6, 1.4);
    secondaryFill.position.set(-30, -20, 30);
    scene.add(secondaryFill);

    const bottomGlow = new THREE.PointLight(0x06b6d4, 1.8, 120);
    bottomGlow.position.set(0, -10, 10);
    scene.add(bottomGlow);

    // 3. Extruded 3D India Geographic Shape
    const shape = new THREE.Shape();
    INDIA_BOUNDARY_COORDS.forEach(([x, y], idx) => {
      if (idx === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 2.2,
      bevelEnabled: true,
      bevelThickness: 0.6,
      bevelSize: 0.5,
      bevelOffset: 0,
      bevelSegments: 3,
    };

    const indiaGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    indiaGeometry.center();

    // Matte dark navy carbon material with subtle metallic sheen
    const indiaMaterial = new THREE.MeshStandardMaterial({
      color: 0x08132e,
      roughness: 0.65,
      metalness: 0.45,
      emissive: 0x03081a,
    });

    const indiaMesh = new THREE.Mesh(indiaGeometry, indiaMaterial);
    indiaMesh.position.set(0, 0, 0);
    scene.add(indiaMesh);

    // Glowing contour border around the perimeter
    const contourPoints = INDIA_BOUNDARY_COORDS.map(([x, y]) => new THREE.Vector3(x, y, 2.85));
    // Center alignment adjustment
    const centerOffset = new THREE.Vector3();
    indiaGeometry.computeBoundingBox();
    if (indiaGeometry.boundingBox) {
      indiaGeometry.boundingBox.getCenter(centerOffset);
    }
    contourPoints.forEach((pt) => pt.sub(centerOffset));

    const contourGeo = new THREE.BufferGeometry().setFromPoints(contourPoints);
    const contourMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.85,
    });
    const contourLoop = new THREE.LineLoop(contourGeo, contourMat);
    scene.add(contourLoop);

    // Atmospheric Grid Floor
    const grid = new THREE.GridHelper(140, 36, 0x06b6d4, 0x0f2147);
    grid.position.set(0, -3, -10);
    grid.rotation.x = Math.PI / 2.3;
    scene.add(grid);

    // 4. Healthcare Nodes (3D Interactive Objects)
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    const nodeMeshes: { mesh: THREE.Mesh; data: FacilityNode3D; rings: THREE.Mesh[]; beacon?: THREE.Mesh }[] = [];

    FACILITY_NODES.forEach((fac) => {
      const colorHex =
        fac.status === "RED"
          ? 0xef4444
          : fac.status === "AMBER"
          ? 0xf59e0b
          : fac.status === "CYAN"
          ? 0x06b6d4
          : 0x10b981;

      // Adjusted position accounting for center offset
      const x = fac.pos[0] - centerOffset.x;
      const y = fac.pos[1] - centerOffset.y;
      const z = fac.pos[2];

      // Central core sphere
      const coreSize = fac.type === "HQ" ? 1.6 : fac.type === "DISTRICT_HOSPITAL" ? 1.3 : 1.0;
      const coreGeo = new THREE.SphereGeometry(coreSize, 20, 20);
      const coreMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.set(x, y, z);
      (coreMesh as any).nodeData = fac;

      // Transparent orbital ring
      const ringGeo = new THREE.RingGeometry(coreSize * 1.5, coreSize * 1.85, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(0, 0, 0);
      coreMesh.add(ringMesh);

      // Vertical beacon column for critical/active nodes
      let beaconMesh: THREE.Mesh | undefined;
      if (fac.status === "RED" || fac.type === "HQ" || fac.status === "CYAN") {
        const beaconGeo = new THREE.CylinderGeometry(0.12, 0.4, 7, 12);
        beaconGeo.translate(0, 3.5, 0);
        beaconGeo.rotateX(Math.PI / 2);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.4,
        });
        beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        coreMesh.add(beaconMesh);
      }

      nodeGroup.add(coreMesh);
      nodeMeshes.push({ mesh: coreMesh, data: fac, rings: [ringMesh], beacon: beaconMesh });
    });

    // 5. Supply Logistics Arcs & Animated Traveling Particles
    const arcObjects: { curve: THREE.QuadraticBezierCurve3; line: THREE.Line; pulse: THREE.Mesh; speed: number }[] = [];

    SUPPLY_ROUTES.forEach((route) => {
      const src = FACILITY_NODES.find((f) => f.id === route.sourceId);
      const tgt = FACILITY_NODES.find((f) => f.id === route.targetId);
      if (!src || !tgt) return;

      const p1 = new THREE.Vector3(src.pos[0] - centerOffset.x, src.pos[1] - centerOffset.y, src.pos[2]);
      const p3 = new THREE.Vector3(tgt.pos[0] - centerOffset.x, tgt.pos[1] - centerOffset.y, tgt.pos[2]);

      // Elevated midpoint to form high 3D arc
      const mid = new THREE.Vector3().addVectors(p1, p3).multiplyScalar(0.5);
      const dist = p1.distanceTo(p3);
      mid.z += Math.max(3.5, dist * 0.35);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p3);
      const points = curve.getPoints(45);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: route.color,
        transparent: true,
        opacity: 0.75,
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      scene.add(arcLine);

      // Light particle packet moving along arc
      const packetGeo = new THREE.SphereGeometry(0.65, 12, 12);
      const packetMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });
      const packetMesh = new THREE.Mesh(packetGeo, packetMat);
      scene.add(packetMesh);

      arcObjects.push({ curve, line: arcLine, pulse: packetMesh, speed: route.speed });
    });

    // 6. Ambient Digital Twin Sensor Particles
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 110;
      particlePos[i * 3 + 1] = (Math.random() - 0.5) * 95;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 45;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.75,
      transparent: true,
      opacity: 0.45,
    });
    const ambientParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(ambientParticles);

    // 7. Raycaster for Interactive Hover & Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let mouseXNorm = 0;
    let mouseYNorm = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / height) * 2 - 1);
      mouseXNorm = mouse.x;
      mouseYNorm = mouse.y;

      if (!interactive) return;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes.map((n) => n.mesh));

      if (intersects.length > 0) {
        const hit = (intersects[0].object as any).nodeData as FacilityNode3D;
        setHoveredNode(hit);
        container.style.cursor = "pointer";
      } else {
        setHoveredNode(null);
        container.style.cursor = "default";
      }
    };

    const handleClick = () => {
      if (!interactive) return;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes.map((n) => n.mesh));

      if (intersects.length > 0) {
        const hit = (intersects[0].object as any).nodeData as FacilityNode3D;
        soundFx.playClick();
        setActiveNode(hit);
        onSelectFacility?.(hit);

        // Smooth camera transition toward node
        targetCamPos.current.set(hit.pos[0] - centerOffset.x + 3, hit.pos[1] - centerOffset.y - 3, 30);
        targetLookAt.current.set(hit.pos[0] - centerOffset.x, hit.pos[1] - centerOffset.y, hit.pos[2]);
      }
    };

    container.addEventListener("mousemove", handlePointerMove);
    container.addEventListener("click", handleClick);

    // 8. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Animate supply arcs
      arcObjects.forEach((arc, i) => {
        const progress = (elapsed * arc.speed * 0.45 + i * 0.3) % 1;
        const pt = arc.curve.getPoint(progress);
        arc.pulse.position.copy(pt);
      });

      // Animate node rings and beacons
      nodeMeshes.forEach((item, i) => {
        item.rings.forEach((ring) => {
          ring.rotation.z += 0.015;
          const scale = 1 + Math.sin(elapsed * 2.5 + i) * 0.08;
          ring.scale.set(scale, scale, 1);
        });

        // Pulsing scale for RED deficit node (Anakaputhur)
        if (item.data.status === "RED") {
          const redScale = 1 + Math.sin(elapsed * 4.5) * 0.22;
          item.mesh.scale.set(redScale, redScale, redScale);
        }
      });

      // Subtle atmospheric movement
      ambientParticles.rotation.y = elapsed * 0.03;

      // Mouse Parallax & Smooth Camera Movement
      const parallaxX = mouseXNorm * 5;
      const parallaxY = mouseYNorm * 4;

      camera.position.x += (targetCamPos.current.x + parallaxX - camera.position.x) * 0.04;
      camera.position.y += (targetCamPos.current.y + parallaxY - camera.position.y) * 0.04;
      camera.position.z += (targetCamPos.current.z - camera.position.z) * 0.04;

      currentLookAt.current.x += (targetLookAt.current.x - currentLookAt.current.x) * 0.05;
      currentLookAt.current.y += (targetLookAt.current.y - currentLookAt.current.y) * 0.05;
      currentLookAt.current.z += (targetLookAt.current.z - currentLookAt.current.z) * 0.05;

      camera.lookAt(currentLookAt.current);

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
      container.removeEventListener("mousemove", handlePointerMove);
      container.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive, onSelectFacility]);

  // Reset to National View
  const handleResetView = () => {
    soundFx.playClick();
    setActiveNode(null);
    setActiveStateRegion(null);
    targetCamPos.current.set(0, 0, 78);
    targetLookAt.current.set(0, -2, 0);
  };

  // State selection handler
  const handleSelectStateRegion = (region: StateRegion3D) => {
    soundFx.playClick();
    setActiveStateRegion(region);
    onSelectState?.(region);
    targetCamPos.current.set(region.cameraPos[0], region.cameraPos[1], region.cameraPos[2]);
    targetLookAt.current.set(region.center[0], region.center[1], region.center[2]);
  };

  return (
    <div
      className={`relative w-full ${heightClass} overflow-hidden rounded-2xl border border-cyan-500/25 glass-panel-glow select-none`}
    >
      <div ref={containerRef} className="w-full h-full" />

      {/* WebGL Fallback Notification if unavailable */}
      {isLite && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
          <ShieldAlert className="w-12 h-12 text-cyan-400 mb-3" />
          <h4 className="text-lg font-bold text-white">WebGL Spatial Canvas Inactive</h4>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Displaying optimized 2D telemetry matrix. Your hardware or browser settings currently limit WebGL acceleration.
          </p>
        </div>
      )}

      {/* Top Left: Operational Mode Badges */}
      {showHUD && (
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-slate-900/90 border border-cyan-500/40 text-cyan-300 backdrop-blur-md flex items-center gap-1.5 shadow-glowCyan">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>SPATIAL DIGITAL TWIN • 90+ NODES</span>
            </span>

            {activeStateRegion && (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-purple-500/20 border border-purple-500/40 text-purple-300 backdrop-blur-md">
                STATE FOCUS: {activeStateRegion.name.toUpperCase()}
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400 hidden sm:block">
            {activeStateRegion
              ? `Zoomed into ${activeStateRegion.name}. Click facilities to inspect buffer telemetry.`
              : "Autonomous surveillance: Drag to rotate, click nodes for live telemetry."}
          </p>
        </div>
      )}

      {/* Top Right: State Quick-Select Buttons & View Reset */}
      {showHUD && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
          <div className="hidden md:flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-1 text-[11px] font-mono backdrop-blur-md">
            {STATE_REGIONS.map((reg) => (
              <button
                key={reg.code}
                onClick={() => handleSelectStateRegion(reg)}
                className={`px-2 py-0.5 rounded transition-all ${
                  activeStateRegion?.code === reg.code
                    ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {reg.code}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetView}
            title="Reset to National Overview"
            className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition-all backdrop-blur-md"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hovered Node Floating Tooltip */}
      {hoveredNode && !activeNode && (
        <div className="absolute top-20 left-4 z-20 glass-panel-glow border border-cyan-500/40 p-3 rounded-xl max-w-xs pointer-events-none backdrop-blur-lg animate-fadeIn">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`w-2 h-2 rounded-full ${
                hoveredNode.status === "RED"
                  ? "bg-rose-500 animate-ping"
                  : hoveredNode.status === "AMBER"
                  ? "bg-amber-400"
                  : hoveredNode.status === "CYAN"
                  ? "bg-cyan-400"
                  : "bg-emerald-400"
              }`}
            />
            <span className="font-bold text-xs text-white">{hoveredNode.name}</span>
          </div>
          <p className="text-[11px] text-slate-300 font-mono">
            {hoveredNode.type} • {hoveredNode.district}, {hoveredNode.state}
          </p>
          <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] flex items-center justify-between text-slate-400">
            <span>Buffer: {hoveredNode.bufferDays} Days</span>
            <span
              className={
                hoveredNode.status === "RED"
                  ? "text-rose-400 font-bold"
                  : hoveredNode.status === "AMBER"
                  ? "text-amber-400"
                  : "text-emerald-400"
              }
            >
              {hoveredNode.statusText}
            </span>
          </div>
        </div>
      )}

      {/* Active Node Detailed Inspection HUD Drawer */}
      {activeNode && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-20 glass-panel-glow border border-cyan-500/50 p-4 rounded-xl backdrop-blur-xl shadow-2xl animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  activeNode.status === "RED"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : activeNode.status === "AMBER"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                }`}
              >
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{activeNode.name}</h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {activeNode.id} • {activeNode.district}, {activeNode.state}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveNode(null)}
              className="text-slate-400 hover:text-white p-1 text-xs"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center">
            <div className="p-1.5 bg-slate-900/60 rounded-lg">
              <span className="text-[9px] uppercase text-slate-400 block">Stock Buffer</span>
              <span className="text-xs font-bold font-mono text-cyan-400">
                {activeNode.bufferDays} Days
              </span>
            </div>
            <div className="p-1.5 bg-slate-900/60 rounded-lg">
              <span className="text-[9px] uppercase text-slate-400 block">Risk P(D&gt;S)</span>
              <span
                className={`text-xs font-bold font-mono ${
                  activeNode.riskProbability > 0.5 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {(activeNode.riskProbability * 100).toFixed(0)}%
              </span>
            </div>
            <div className="p-1.5 bg-slate-900/60 rounded-lg">
              <span className="text-[9px] uppercase text-slate-400 block">Units on Hand</span>
              <span className="text-xs font-bold font-mono text-white">
                {activeNode.currentStock}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-mono">SKU: {activeNode.drugSku}</span>
            <span
              className={`font-semibold ${
                activeNode.status === "RED"
                  ? "text-rose-400"
                  : activeNode.status === "AMBER"
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {activeNode.statusText}
            </span>
          </div>
        </div>
      )}

      {/* Bottom Right: Status Legend */}
      <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-slate-950/85 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] backdrop-blur-md z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-glowGreen" />
          <span className="text-slate-300">Surplus</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-glowAmber" />
          <span className="text-slate-300">Surge Watch</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="text-slate-300">Stock-Out Imminent</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-glowCyan" />
          <span className="text-slate-300">Logistics Flow</span>
        </div>
      </div>
    </div>
  );
}
