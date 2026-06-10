"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";

/**
 * THE ONE 3D ACCENT — a slow point-field lattice receding under the
 * hero type. Bone dust on void with a scatter of ember and violet
 * motes, displaced by two crossing waves, drifting at film speed with
 * a whisper of pointer parallax. Reduced motion: a single static frame.
 */

const COLS = 96;
const ROWS = 40;
const SP = 0.21;

function wave(x: number, y: number, t: number) {
  return Math.sin(x * 0.55 + t * 0.32) * 0.4 + Math.cos(y * 0.7 + t * 0.21) * 0.3;
}

function buildGrid(stride: number, offset: number) {
  const pts: number[] = [];
  let i = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (i++ % stride !== offset) continue;
      const x = (c - COLS / 2) * SP;
      const y = (r - ROWS / 2) * SP;
      pts.push(x, y, wave(x, y, 0));
    }
  }
  return new Float32Array(pts);
}

function Cloud({
  positions,
  color,
  size,
  opacity,
  animate,
}: {
  positions: Float32Array;
  color: string;
  size: number;
  opacity: number;
  animate: boolean;
}) {
  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!animate || !ref.current) return;
    const t = state.clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 2] = wave(arr[i], arr[i + 1], t);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Field({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);

  const bone = useMemo(() => buildGrid(1, 0), []);
  // sparse colored motes sampled off-grid so they read as embers, not rows
  const ember = useMemo(() => buildGrid(53, 17), []);
  const violet = useMemo(() => buildGrid(89, 40), []);

  useFrame((state) => {
    if (!animate || !group.current) return;
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -1.12 + state.pointer.y * 0.04,
      0.02
    );
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      state.pointer.x * 0.05,
      0.02
    );
  });

  return (
    <group ref={group} rotation={[-1.12, 0, 0]} position={[0, -1.1, 0]}>
      <Cloud positions={bone} color="#e9e7e0" size={0.02} opacity={0.4} animate={animate} />
      <Cloud positions={ember} color="#ff5a1f" size={0.045} opacity={0.65} animate={animate} />
      <Cloud positions={violet} color="#c77dff" size={0.04} opacity={0.5} animate={animate} />
    </group>
  );
}

export default function HeroField() {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden
      className="absolute inset-0 [mask-image:radial-gradient(120%_85%_at_50%_0%,black_35%,transparent_78%)]"
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.4], fov: 44 }}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        frameloop={reduced ? "demand" : "always"}
      >
        <Field animate={!reduced} />
      </Canvas>
    </div>
  );
}
