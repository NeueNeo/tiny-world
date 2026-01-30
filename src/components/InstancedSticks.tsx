import { useRef, useMemo, useEffect } from 'react';
import { 
  InstancedMesh, 
  Object3D, 
  Color, 
  CylinderGeometry,
  MeshStandardMaterial,
} from 'three';

interface InstancedSticksProps {
  count?: number;
  seed?: number;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const stickColors = [
  '#8B7355',
  '#7A6347',
  '#6B5344',
  '#9C8B6E',
  '#5C4A3D',
];

export function InstancedSticks({ 
  count = 50, 
  seed = 7777 
}: InstancedSticksProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  
  // Simple cylinder instead of expensive TubeGeometry
  const geometry = useMemo(() => {
    const geom = new CylinderGeometry(0.012, 0.018, 1, 5);
    geom.rotateZ(Math.PI / 2); // Lay flat
    return geom;
  }, []);
  
  const material = useMemo(() => new MeshStandardMaterial({ 
    color: '#8B7355',
    roughness: 0.9,
  }), []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);
  
  // Pre-calculate stick data
  const stickData = useMemo(() => {
    const sticks: { x: number; z: number; rotY: number; rotZ: number; scale: number; color: Color }[] = [];
    
    for (let i = 0; i < count; i++) {
      const s = seed + i * 17;
      
      const x = (seededRandom(s) - 0.5) * 23;
      const z = (seededRandom(s + 1) - 0.5) * 23;
      const rotY = seededRandom(s + 2) * Math.PI * 2;
      const rotZ = (seededRandom(s + 3) - 0.5) * 0.3; // Slight tilt
      const scale = 0.3 + seededRandom(s + 4) * 0.5;
      
      const colorIdx = Math.floor(seededRandom(s + 5) * stickColors.length);
      const color = new Color(stickColors[colorIdx]);
      
      sticks.push({ x, z, rotY, rotZ, scale, color });
    }
    
    return sticks;
  }, [count, seed]);
  
  // Set transforms once
  useEffect(() => {
    if (!meshRef.current) return;
    
    stickData.forEach((stick, i) => {
      dummy.position.set(stick.x, 0.01, stick.z);
      dummy.rotation.set(0, stick.rotY, stick.rotZ);
      dummy.scale.set(stick.scale, 1, 1);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, stick.color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [stickData, dummy]);
  
  if (count === 0) return null;
  
  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, count]}
      frustumCulled
    />
  );
}
