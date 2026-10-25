import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
function System() {
  const group = useRef<THREE.Group>(null);
  const points = useMemo(() => {
    const list: THREE.Vector3[] = [];
    const phi = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < 26; i++) {
      const y = 1 - (i / 25) * 2;
      const radius = Math.sqrt(1 - y * y);
      const angle = (2 * Math.PI * i) / phi;
      list.push(
        new THREE.Vector3(
          Math.cos(angle) * radius * 2.15,
          y * 2.15,
          Math.sin(angle) * radius * 2.15,
        ),
      );
    }
    return list;
  }, []);
  const edges = useMemo(() => {
    const pairs: [THREE.Vector3, THREE.Vector3][] = [];
    points.forEach((a, i) =>
      points.slice(i + 1).forEach((b) => {
        if (a.distanceTo(b) < 1.65) pairs.push([a, b]);
      }),
    );
    return pairs;
  }, [points]);
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.075;
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        state.pointer.y * 0.1 + window.scrollY * 0.00015,
        0.025,
      );
      group.current.position.x = THREE.MathUtils.lerp(
        group.current.position.x,
        state.pointer.x * 0.13,
        0.025,
      );
    }
  });
  return (
    <group ref={group} rotation={[0.3, 0.4, -0.15]}>
      {edges.map((edge, i) => (
        <Line
          key={i}
          points={edge}
          color="#5f99d2"
          transparent
          opacity={0.38}
          lineWidth={0.8}
        />
      ))}
      {points.map((point, i) => (
        <mesh key={i} position={point}>
          <sphereGeometry args={[i % 5 === 0 ? 0.095 : 0.045, 16, 16]} />
          <meshStandardMaterial
            color={i % 5 === 0 ? "#187bc3" : "#9dbedc"}
            metalness={0.75}
            roughness={0.2}
          />
        </mesh>
      ))}
      <mesh>
        <icosahedronGeometry args={[1.12, 0]} />
        <meshPhysicalMaterial
          color="#cce4f5"
          metalness={0.25}
          roughness={0.15}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.13, 0]} />
        <meshBasicMaterial
          color="#448ac1"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[(i * Math.PI) / 3, Math.PI / 3, i * 0.9]}>
          <torusGeometry args={[2.55, 0.008, 8, 128]} />
          <meshStandardMaterial color="#97bad7" transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  );
}
export default function HeroScene({ active = true }: { active?: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, 7.5], fov: 45 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
    >
      <ambientLight intensity={2} />
      <directionalLight position={[4, 5, 6]} intensity={3} />
      <System />
    </Canvas>
  );
}
