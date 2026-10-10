import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Float } from '@react-three/drei';

function CreditCard3D({ name, income, spent }) {
  const meshRef = useRef();

  // Subtle rotation following the mouse cursor
  useFrame((state) => {
    const { x, y } = state.pointer;
    meshRef.current.rotation.y = (x * Math.PI) / 8;
    meshRef.current.rotation.x = (-y * Math.PI) / 8;
  });

  const balance = income - spent;

  return (
    <group ref={meshRef}>
      {/* Main Card Mesh */}
      <RoundedBox args={[3.4, 2.1, 0.1]} radius={0.12} smoothness={4}>
        <meshPhysicalMaterial
          color="#1e1e2f"
          roughness={0.2}
          metalness={0.8}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transmission={0.2}
          opacity={0.95}
          transparent
        />
      </RoundedBox>

      {/* Card Chip */}
      <mesh position={[-1.1, 0.3, 0.06]}>
        <planeGeometry args={[0.4, 0.3]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* User Name */}
      <Text
        position={[-1.3, -0.6, 0.06]}
        fontSize={0.14}
        color="#ffffff"
        anchorX="left"
      >
        {name ? name.toUpperCase() : 'VALUED USER'}
      </Text>

      {/* Balance Label & Amount */}
      <Text
        position={[1.3, 0.5, 0.06]}
        fontSize={0.1}
        color="#aaa"
        anchorX="right"
      >
        NET BALANCE
      </Text>
      <Text
        position={[1.3, 0.25, 0.06]}
        fontSize={0.22}
        color={balance >= 0 ? '#4caf50' : '#f44336'}
        anchorX="right"
      >
        {`₦${balance.toLocaleString()}`}
      </Text>
    </group>
  );
}

export default function BudgetCard3D({ name, income, spent }) {
  return (
    <div style={{ height: '220px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <pointLight position={[-5, -5, -2]} color="#0070f3" intensity={3} />
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <CreditCard3D name={name} income={income} spent={spent} />
        </Float>
      </Canvas>
    </div>
  );
}