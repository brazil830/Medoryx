"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { INDIA_BOUNDARY_COORDS, FACILITY_NODES } from "./indiaData";

interface AuthScene3DProps {
  activeState?: string | null;
  activeRole?: string | null;
  authenticating?: boolean;
}

export default function AuthScene3D({
  activeState = "Tamil Nadu",
  activeRole = "DISTRICT_OFFICER",
  authenticating = false,
}: AuthScene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const authStateRef = useRef(authenticating);
  authStateRef.current = authenticating;

  const targetStateRef = useRef(activeState);
  targetStateRef.current = activeState;

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 700;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.012);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, -4, 68);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0x1e293b, 1.6);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0x22d3ee, 2.5);
    keyLight.position.set(20, 30, 40);
    scene.add(keyLight);

    // India Silhouette Mesh
    const shape = new THREE.Shape();
    INDIA_BOUNDARY_COORDS.forEach(([x, y], idx) => {
      if (idx === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();

    const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: 1.5,
      bevelEnabled: true,
      bevelThickness: 0.4,
      bevelSize: 0.3,
    });
    extrudeGeo.center();

    const indiaMat = new THREE.MeshStandardMaterial({
      color: 0x071126,
      roughness: 0.6,
      metalness: 0.5,
      emissive: 0x030a17,
    });
    const indiaMesh = new THREE.Mesh(extrudeGeo, indiaMat);
    scene.add(indiaMesh);

    // Contour loop
    const centerOffset = new THREE.Vector3();
    extrudeGeo.computeBoundingBox();
    if (extrudeGeo.boundingBox) extrudeGeo.boundingBox.getCenter(centerOffset);

    const contourPoints = INDIA_BOUNDARY_COORDS.map(
      ([x, y]) => new THREE.Vector3(x - centerOffset.x, y - centerOffset.y, 2.0)
    );
    const contourGeo = new THREE.BufferGeometry().setFromPoints(contourPoints);
    const contourMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.6 });
    const contourLoop = new THREE.LineLoop(contourGeo, contourMat);
    scene.add(contourLoop);

    // Facility Nodes in Auth Scene
    const nodeMeshes: { mesh: THREE.Mesh; state: string; baseColor: number }[] = [];

    FACILITY_NODES.forEach((fac) => {
      const color = fac.status === "RED" ? 0xef4444 : fac.status === "AMBER" ? 0xf59e0b : 0x10b981;
      const sGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const sMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
      });
      const mesh = new THREE.Mesh(sGeo, sMat);
      mesh.position.set(fac.pos[0] - centerOffset.x, fac.pos[1] - centerOffset.y, fac.pos[2]);
      scene.add(mesh);

      nodeMeshes.push({ mesh, state: fac.state, baseColor: color });
    });

    // Convergence Data Rings for Authentication
    const ringGeo = new THREE.RingGeometry(2, 2.3, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const authRing = new THREE.Mesh(ringGeo, ringMat);
    authRing.position.set(5 - centerOffset.x, -16 - centerOffset.y, 3);
    scene.add(authRing);

    // Ambient floating particles
    const pCount = 180;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 80;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x06b6d4, size: 0.6, transparent: true, opacity: 0.4 });
    const pPoints = new THREE.Points(pGeo, pMat);
    scene.add(pPoints);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Subtle slow orbital drift
      indiaMesh.rotation.z = Math.sin(elapsed * 0.2) * 0.05;
      contourLoop.rotation.z = indiaMesh.rotation.z;

      // React to active state
      const targetState = targetStateRef.current;
      nodeMeshes.forEach((item) => {
        const isSelectedState = targetState && item.state.toLowerCase() === targetState.toLowerCase();
        if (isSelectedState) {
          const s = 1.3 + Math.sin(elapsed * 4) * 0.2;
          item.mesh.scale.set(s, s, s);
          (item.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2;
        } else {
          item.mesh.scale.set(1, 1, 1);
          (item.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
        }
      });

      // Authentication convergence animation
      if (authStateRef.current) {
        authRing.scale.set(
          1 + Math.sin(elapsed * 8) * 0.5,
          1 + Math.sin(elapsed * 8) * 0.5,
          1
        );
        camera.position.z += (45 - camera.position.z) * 0.08;
      } else {
        authRing.scale.set(1, 1, 1);
        camera.position.z += (68 - camera.position.z) * 0.03;
      }

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
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none opacity-80 overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
