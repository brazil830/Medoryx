"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { soundFx } from "@/lib/audio";
import {
  TrendingUp,
  Layers,
  Activity,
  AlertTriangle,
  RotateCcw,
  Maximize2,
  Info,
} from "lucide-react";

interface ForecastSurface3DProps {
  dailyForecasts?: number[];
  alpha01?: number[];
  alpha09?: number[];
  currentStock?: number;
  facilityName?: string;
}

export default function ForecastSurface3D({
  dailyForecasts = [12, 14, 15, 13, 16, 20, 25, 28, 32, 30, 26, 22, 18, 17, 19, 21, 24, 26, 25, 23, 20, 18, 17, 16, 15, 15, 16, 17, 18, 19],
  alpha01 = [8, 9, 10, 8, 11, 14, 18, 20, 24, 22, 19, 15, 12, 11, 13, 15, 17, 19, 18, 16, 14, 12, 11, 10, 10, 10, 11, 12, 13, 13],
  alpha09 = [17, 19, 21, 19, 22, 28, 34, 38, 42, 40, 35, 30, 25, 24, 27, 29, 33, 35, 34, 31, 28, 25, 24, 23, 22, 22, 23, 24, 25, 26],
  currentStock = 4,
  facilityName = "PHC Anakaputhur",
}: ForecastSurface3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredDay, setHoveredDay] = useState<{ day: number; val: number; lower: number; upper: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 700;
    const height = container.clientHeight || 420;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -22, 28);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0x1e293b, 1.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x06b6d4, 2.5);
    dirLight.position.set(15, 25, 30);
    scene.add(dirLight);

    // Grid Floor
    const grid = new THREE.GridHelper(36, 18, 0x06b6d4, 0x111c38);
    grid.position.set(0, 0, -5);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    // 3D Forecast Curve Line
    const days = dailyForecasts.length;
    const curvePoints: THREE.Vector3[] = [];
    const lowerPoints: THREE.Vector3[] = [];
    const upperPoints: THREE.Vector3[] = [];

    const xSpan = 26;
    const startX = -xSpan / 2;
    const stepX = xSpan / (days - 1);

    for (let i = 0; i < days; i++) {
      const x = startX + i * stepX;
      const y = (dailyForecasts[i] || 15) * 0.4 - 5;
      const lowerY = (alpha01[i] || 10) * 0.4 - 5;
      const upperY = (alpha09[i] || 25) * 0.4 - 5;

      curvePoints.push(new THREE.Vector3(x, y, 0));
      lowerPoints.push(new THREE.Vector3(x, lowerY, -1.8));
      upperPoints.push(new THREE.Vector3(x, upperY, 1.8));
    }

    // Midline Forecast Path
    const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, linewidth: 2 });
    const mainCurve = new THREE.Line(curveGeo, curveMat);
    scene.add(mainCurve);

    // Confidence Band Volumetric Ribbon
    const bandGeo = new THREE.BufferGeometry();
    const bandVertices: number[] = [];
    const bandIndices: number[] = [];

    for (let i = 0; i < days; i++) {
      // Top vertex (upper confidence)
      bandVertices.push(upperPoints[i].x, upperPoints[i].y, upperPoints[i].z);
      // Bottom vertex (lower confidence)
      bandVertices.push(lowerPoints[i].x, lowerPoints[i].y, lowerPoints[i].z);

      if (i < days - 1) {
        const base = i * 2;
        bandIndices.push(base, base + 1, base + 2);
        bandIndices.push(base + 1, base + 3, base + 2);
      }
    }

    bandGeo.setAttribute("position", new THREE.Float32BufferAttribute(bandVertices, 3));
    bandGeo.setIndex(bandIndices);
    bandGeo.computeVertexNormals();

    const bandMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.3,
    });
    const bandMesh = new THREE.Mesh(bandGeo, bandMat);
    scene.add(bandMesh);

    // Current Stock Threshold Plane (Stock Floor)
    const stockY = currentStock * 0.4 - 5;
    const planeGeo = new THREE.PlaneGeometry(xSpan, 6);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const stockPlane = new THREE.Mesh(planeGeo, planeMat);
    stockPlane.position.set(0, stockY, 0);
    scene.add(stockPlane);

    // Interactive Day Data Spheres along the curve
    const daySpheres: { mesh: THREE.Mesh; index: number }[] = [];
    curvePoints.forEach((pt, idx) => {
      const sGeo = new THREE.SphereGeometry(0.35, 12, 12);
      const sMat = new THREE.MeshBasicMaterial({
        color: dailyForecasts[idx] > currentStock ? 0xef4444 : 0x10b981,
      });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.copy(pt);
      (sMesh as any).dayIdx = idx;
      scene.add(sMesh);
      daySpheres.push({ mesh: sMesh, index: idx });
    });

    // Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / height) * 2 - 1);

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        bandMesh.rotation.z += deltaX * 0.008;
        bandMesh.rotation.x += deltaY * 0.008;
        mainCurve.rotation.copy(bandMesh.rotation);
        stockPlane.rotation.copy(bandMesh.rotation);
        daySpheres.forEach((s) => {
          s.mesh.position.applyAxisAngle(new THREE.Vector3(0, 0, 1), deltaX * 0.008);
        });
      }

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(daySpheres.map((s) => s.mesh));
      if (hits.length > 0) {
        const idx = (hits[0].object as any).dayIdx as number;
        setHoveredDay({
          day: idx + 1,
          val: dailyForecasts[idx],
          lower: alpha01[idx],
          upper: alpha09[idx],
        });
        container.style.cursor = "pointer";
      } else {
        container.style.cursor = isDragging ? "grabbing" : "grab";
      }
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("mousemove", onMouseMove);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Subtle float oscillation
      bandMesh.position.z = Math.sin(elapsed * 1.5) * 0.2;
      mainCurve.position.z = bandMesh.position.z;

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
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [dailyForecasts, alpha01, alpha09, currentStock]);

  return (
    <div className="relative w-full h-[460px] rounded-2xl border border-cyan-500/25 glass-panel-glow overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab" />

      {/* Header Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 backdrop-blur-md flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>3D PROJECTION TERRAIN • {facilityName.toUpperCase()}</span>
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30 backdrop-blur-md">
            ALPHA 0.1 / 0.9 CONFIDENCE VOLUME
          </span>
        </div>
        <p className="text-[11px] text-slate-400 font-mono mt-1">
          Click &amp; drag to rotate forecast spatial volume. Red plane marks effective stock floor.
        </p>
      </div>

      {/* Hovered Day Inspection Card */}
      {hoveredDay && (
        <div className="absolute top-16 right-4 z-10 glass-panel-glow border border-cyan-500/40 p-3 rounded-xl backdrop-blur-md shadow-2xl animate-fadeIn text-xs">
          <div className="flex items-center justify-between gap-4 font-mono font-bold text-white mb-2">
            <span>Projection: Day {hoveredDay.day}</span>
            <span className={hoveredDay.val > currentStock ? "text-rose-400" : "text-emerald-400"}>
              {hoveredDay.val > currentStock ? "DEFICIT RISK" : "COVERED"}
            </span>
          </div>
          <div className="space-y-1 text-slate-300 font-mono text-[11px]">
            <p>• Expected Demand: <strong className="text-cyan-300">{hoveredDay.val} Packs</strong></p>
            <p>• Confidence Band: [{hoveredDay.lower} - {hoveredDay.upper}]</p>
            <p>• Current Stock: <strong className="text-rose-400">{currentStock} Packs</strong></p>
          </div>
        </div>
      )}

      {/* Bottom Status Legend */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-xs backdrop-blur-md bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2">
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-cyan-400" />
            <span className="text-slate-300">Point Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-cyan-500/30 border border-cyan-400 rounded-sm" />
            <span className="text-slate-300">&alpha; [0.1 - 0.9] Volume</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-rose-500" />
            <span className="text-rose-400">Stock Floor ({currentStock} Units)</span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
          LightGBM + Quantile Loss &bull; Vertex AI Replica
        </span>
      </div>
    </div>
  );
}
