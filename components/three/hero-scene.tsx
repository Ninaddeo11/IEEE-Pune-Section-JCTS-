import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
const positions: [number, number, number][] = [
  [-2.1, 0.7, 0.2],
  [-0.85, 1.65, -0.8],
  [0.1, -0.45, 1.2],
  [1.65, 1.0, 0],
  [2.3, -0.8, -0.3],
];
function Node({
  position,
  index,
  selected,
  onSelect,
}: {
  position: [number, number, number];
  index: number;
  selected: number | null;
  onSelect: (i: number | null) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }, delta) => {
    if (ref.current) {
      const scale =
        selected === index
          ? 1.65
          : 1 + Math.sin(clock.elapsedTime * 0.7 + index) * 0.1;
      ref.current.scale.lerp(
        new THREE.Vector3(scale, scale, scale),
        Math.min(1, delta * 4),
      );
    }
  });
  return (
    <group position={position}>
      <mesh
        ref={ref}
        onPointerOver={(e) => {
          e.stopPropagation();
          onSelect(index);
        }}
        onPointerOut={() => onSelect(null)}
      >
        <sphereGeometry args={[0.105, 20, 20]} />
        <meshStandardMaterial
          color={selected === index ? "#0a84ff" : "#00629b"}
          metalness={0.65}
          roughness={0.2}
          emissive="#00629b"
          emissiveIntensity={selected === index ? 0.7 : 0.1}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.19, 0.198, 48]} />
        <meshBasicMaterial
          color="#187db1"
          transparent
          opacity={selected === index ? 0.9 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
function KnowledgeSystem({
  selected,
  onSelect,
}: {
  selected: number | null;
  onSelect: (i: number | null) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const particles = useRef<THREE.Points>(null);
  const positionsArray = useMemo(() => {
    const points = new Float32Array(384 * 3);
    for (let i = 0; i < 384; i++) {
      const lane = i % 3,
        t = (i / 384) * Math.PI * 5;
      points[i * 3] = Math.sin(t * 1.7 + lane) * 3.7;
      points[i * 3 + 1] = Math.cos(t * 0.8 + lane) * 2.1;
      points[i * 3 + 2] = Math.sin(t * 0.6) * 1.8 - 1;
    }
    return points;
  }, []);
  const curves = useMemo(
    () =>
      positions.flatMap((a, i) =>
        positions
          .slice(i + 1)
          .filter((_, j) => (i + j) % 2 === 0 || i === 2)
          .map((b) =>
            new THREE.QuadraticBezierCurve3(
              new THREE.Vector3(...a),
              new THREE.Vector3(
                (a[0] + b[0]) / 2,
                (a[1] + b[1]) / 2 + 0.8,
                -0.8,
              ),
              new THREE.Vector3(...b),
            ).getPoints(40),
          ),
      ),
    [],
  );
  const paths = useMemo(
    () =>
      [0, 1, 2].map((lane) =>
        Array.from({ length: 100 }, (_, i) => {
          const t = (i / 99) * Math.PI * 1.75;
          return new THREE.Vector3(
            Math.cos(t) * (2.8 + lane * 0.28),
            Math.sin(t) * (0.75 + lane * 0.3) + lane * 0.15,
            Math.sin(t * 1.4 + lane) * 0.9,
          );
        }),
      ),
    [],
  );
  useFrame((state, delta) => {
    const progress = Math.min(1, window.scrollY / window.innerHeight);
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        state.pointer.x * 0.13 +
          Math.sin(state.clock.elapsedTime * 0.055) * 0.1,
        Math.min(1, delta * 2),
      );
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        state.pointer.y * 0.08 + progress * 0.16,
        Math.min(1, delta * 2),
      );
      group.current.position.x = THREE.MathUtils.lerp(
        group.current.position.x,
        -progress * 0.3,
        Math.min(1, delta * 2),
      );
      group.current.scale.setScalar(1 + progress * 0.08);
    }
    if (particles.current) particles.current.rotation.y += delta * 0.012;
    state.camera.position.z = THREE.MathUtils.lerp(
      state.camera.position.z,
      7.7 - progress * 0.6,
      Math.min(1, delta * 2),
    );
  });
  return (
    <group ref={group} rotation={[0.08, -0.08, -0.08]}>
      <points ref={particles}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positionsArray, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#83b2cd"
          size={0.018}
          sizeAttenuation
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </points>
      {curves.map((points, i) => (
        <Line
          key={i}
          points={points}
          color={selected !== null ? "#1480bc" : "#82aec7"}
          transparent
          opacity={selected !== null ? 0.65 : 0.34}
          lineWidth={selected !== null ? 1 : 0.65}
        />
      ))}
      {paths.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#93bbd1"
          transparent
          opacity={0.3}
          lineWidth={0.55}
        />
      ))}
      {positions.map((position, i) => (
        <Node
          key={i}
          position={position}
          index={i}
          selected={selected}
          onSelect={onSelect}
        />
      ))}
      {Array.from({ length: 20 }, (_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * 2.4) * 2.7,
            Math.cos(i * 1.8) * 1.6,
            Math.sin(i) * 0.8 - 0.5,
          ]}
        >
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color="#7c9eb4" />
        </mesh>
      ))}
      <mesh rotation={[0.7, 0.4, 0.3]} position={[0.15, 0.45, -0.1]}>
        <octahedronGeometry args={[1.15, 0]} />
        <meshPhysicalMaterial
          color="#c9e8f5"
          metalness={0.18}
          roughness={0.2}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[0.7, 0.4, 0.3]} position={[0.15, 0.45, -0.1]}>
        <octahedronGeometry args={[1.16, 0]} />
        <meshBasicMaterial
          color="#548eae"
          wireframe
          transparent
          opacity={0.28}
        />
      </mesh>
    </group>
  );
}
export default function HeroScene({
  active = true,
  selected = null,
  onSelect,
}: {
  active?: boolean;
  selected?: number | null;
  onSelect: (i: number | null) => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, 7.7], fov: 44 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
    >
      <ambientLight intensity={2.3} />
      <directionalLight position={[4, 5, 6]} intensity={3} />
      <KnowledgeSystem selected={selected} onSelect={onSelect} />
    </Canvas>
  );
}
