import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { 
  InstancedMesh, 
  Object3D, 
  CylinderGeometry,
  MeshBasicMaterial,
} from 'three';

interface InstancedRainProps {
  count?: number;
  area?: number;
  speed?: number;
}

// Seeded random for consistent initial positions
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function InstancedRain({ 
  count = 800, 
  area = 25, 
  speed = 15 
}: InstancedRainProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  
  // Thin elongated cylinder for raindrop
  const geometry = useMemo(() => {
    const geom = new CylinderGeometry(0.008, 0.008, 0.4, 4);
    return geom;
  }, []);
  
  const material = useMemo(() => new MeshBasicMaterial({ 
    color: '#8cb4d4',
    transparent: true,
    opacity: 0.4,
  }), []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);
  
  // Pre-calculate raindrop data
  const rainData = useMemo(() => {
    const data: { x: number; z: number; startY: number; speed: number }[] = [];
    
    for (let i = 0; i < count; i++) {
      const seed = i * 17;
      data.push({
        x: (seededRandom(seed) - 0.5) * area,
        z: (seededRandom(seed + 1) - 0.5) * area,
        startY: seededRandom(seed + 2) * 15 + 5, // Random start height 5-20
        speed: speed + seededRandom(seed + 3) * 5, // Vary speed slightly
      });
    }
    
    return data;
  }, [count, area, speed]);
  
  // Set initial positions
  useEffect(() => {
    if (!meshRef.current) return;
    
    rainData.forEach((drop, i) => {
      dummy.position.set(drop.x, drop.startY, drop.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [rainData, dummy]);
  
  // Animate rain falling
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const elapsed = state.clock.elapsedTime;
    const windX = Math.sin(elapsed * 0.3) * 0.5;
    const len = rainData.length;
    
    for (let i = 0; i < len; i++) {
      const drop = rainData[i];
      // Calculate current Y position with wrapping
      let y = drop.startY - (elapsed * drop.speed) % 25;
      
      // Wrap around when below ground
      if (y < -5) {
        y += 25;
      }
      
      dummy.position.set(drop.x + windX, y, drop.z);
      dummy.rotation.set(0.1, 0, 0); // Slight angle for motion blur effect
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}
