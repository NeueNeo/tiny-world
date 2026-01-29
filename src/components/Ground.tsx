import { useRef } from 'react';
import { Mesh } from 'three';

export function Ground() {
  const meshRef = useRef<Mesh>(null);
  
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[25, 25, 32, 32]} />
      <meshStandardMaterial 
        color="#4a7c59"
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
}
