import { useRef, useMemo, useEffect } from 'react';
import { 
  InstancedMesh, 
  Object3D, 
  Color, 
  SphereGeometry,
  MeshStandardMaterial,
} from 'three';
import type { Plant } from '../world/types';

interface InstancedMossProps {
  plants: Plant[];
  worldWidth: number;
  worldHeight: number;
}

function toSceneCoords(x: number, y: number, worldWidth: number, worldHeight: number): [number, number, number] {
  const sceneX = (x / worldWidth - 0.5) * 24;
  const sceneZ = (y / worldHeight - 0.5) * 24;
  return [sceneX, 0, sceneZ];
}

// Seeded random for consistent cushion generation
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function InstancedMoss({ plants, worldWidth, worldHeight }: InstancedMossProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  
  const mossPlants = useMemo(() => plants.filter(p => p.type === 'moss'), [plants]);
  
  // Each moss plant gets multiple small cushion bumps to create organic clumpy look
  const cushionsPerPlant = 5;
  const totalInstances = mossPlants.length * cushionsPerPlant;
  
  // Hemisphere geometry for soft moss cushion look
  const geometry = useMemo(() => {
    // Half sphere, flattened vertically for cushion shape
    const geom = new SphereGeometry(0.1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    return geom;
  }, []);
  
  const material = useMemo(() => new MeshStandardMaterial({ 
    roughness: 0.95,
    metalness: 0.0,
  }), []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);
  
  // Pre-calculate moss cushion data
  const cushionData = useMemo(() => {
    const data: { x: number; z: number; scaleX: number; scaleY: number; scaleZ: number; color: Color }[] = [];
    
    mossPlants.forEach((plant, plantIdx) => {
      const [px, , pz] = toSceneCoords(plant.pos.x, plant.pos.y, worldWidth, worldHeight);
      const baseScale = plant.size / 10;
      const baseColor = new Color(plant.color);
      
      // Create multiple cushions per moss plant
      for (let i = 0; i < cushionsPerPlant; i++) {
        const seed = plantIdx * 100 + i;
        
        // Offset from center - tighter grouping for natural clump
        const angle = seededRandom(seed) * Math.PI * 2;
        const dist = seededRandom(seed + 1) * 0.12 * baseScale;
        
        // Vary sizes - some larger central cushions, smaller peripheral ones
        const isCentral = i === 0;
        const sizeVar = isCentral ? 1.2 : (0.5 + seededRandom(seed + 2) * 0.7);
        
        // Flatten vertically for cushion look, vary width/depth
        const scaleX = baseScale * sizeVar * (0.8 + seededRandom(seed + 3) * 0.4);
        const scaleY = baseScale * sizeVar * (0.3 + seededRandom(seed + 4) * 0.3); // Flattened
        const scaleZ = baseScale * sizeVar * (0.8 + seededRandom(seed + 5) * 0.4);
        
        // Vary color slightly within the clump - some lighter, some darker
        const colorVariation = (seededRandom(seed + 6) - 0.5) * 0.15;
        const cushionColor = baseColor.clone();
        cushionColor.offsetHSL(0, 0, colorVariation);
        
        data.push({
          x: px + Math.cos(angle) * dist,
          z: pz + Math.sin(angle) * dist,
          scaleX,
          scaleY,
          scaleZ,
          color: cushionColor,
        });
      }
    });
    
    return data;
  }, [mossPlants, worldWidth, worldHeight]);
  
  // Set transforms and colors
  useEffect(() => {
    if (!meshRef.current) return;
    
    cushionData.forEach((cushion, i) => {
      // Position at ground level
      dummy.position.set(cushion.x, 0, cushion.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(cushion.scaleX, cushion.scaleY, cushion.scaleZ);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, cushion.color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [cushionData, dummy]);
  
  if (totalInstances === 0) return null;
  
  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, totalInstances]}
      frustumCulled
      receiveShadow
    />
  );
}
