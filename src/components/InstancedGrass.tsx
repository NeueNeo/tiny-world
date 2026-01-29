import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color, BoxGeometry, MeshStandardMaterial } from 'three';
import type { Plant } from '../world/types';

interface InstancedGrassProps {
  plants: Plant[];
  worldWidth: number;
  worldHeight: number;
}

function toSceneCoords(x: number, y: number, worldWidth: number, worldHeight: number): [number, number, number] {
  const sceneX = (x / worldWidth - 0.5) * 21;
  const sceneZ = (y / worldHeight - 0.5) * 21;
  return [sceneX, 0, sceneZ];
}

// Seeded random for consistent blade generation
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function InstancedGrass({ plants, worldWidth, worldHeight }: InstancedGrassProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  
  // Shared geometry and material - pivot at bottom so rotation anchors the base
  const geometry = useMemo(() => {
    const geom = new BoxGeometry(0.02, 1, 0.008);
    geom.translate(0, 0.5, 0); // Shift geometry so origin is at bottom
    return geom;
  }, []);
  const material = useMemo(() => new MeshStandardMaterial({ 
    color: '#228b22', 
    roughness: 0.85 
  }), []);
  
  // Calculate total instances needed
  const grassPlants = plants.filter(p => p.type === 'grass');
  const bladePlants = plants.filter(p => p.type === 'blade');
  
  const bladesPerClump = 8;
  const totalInstances = grassPlants.length * bladesPerClump + bladePlants.length;
  
  // Pre-calculate all blade data
  const bladeData = useMemo(() => {
    const data: { x: number; y: number; z: number; height: number; rotY: number; lean: number; color: Color }[] = [];
    
    // Grass clumps
    grassPlants.forEach((plant, plantIdx) => {
      const [px, , pz] = toSceneCoords(plant.pos.x, plant.pos.y, worldWidth, worldHeight);
      const scale = plant.size / 1.5;
      const baseColor = new Color(plant.color);
      
      for (let i = 0; i < bladesPerClump; i++) {
        const seed = plantIdx * 100 + i;
        const angle = (i / bladesPerClump) * Math.PI * 2 + seededRandom(seed) * 0.5;
        const dist = seededRandom(seed + 1) * 0.08;
        const height = (0.15 + seededRandom(seed + 2) * 0.35) * scale;
        
        data.push({
          x: px + Math.cos(angle) * dist * scale,
          y: 0, // Base at ground level
          z: pz + Math.sin(angle) * dist * scale,
          height,
          rotY: seededRandom(seed + 3) * Math.PI,
          lean: (seededRandom(seed + 4) - 0.5) * 0.4,
          color: baseColor,
        });
      }
    });
    
    // Single blades
    bladePlants.forEach((plant, plantIdx) => {
      const [px, , pz] = toSceneCoords(plant.pos.x, plant.pos.y, worldWidth, worldHeight);
      const scale = plant.size / 1.2;
      const seed = plantIdx * 1000;
      const height = (0.2 + seededRandom(seed) * 0.4) * scale;
      
      data.push({
        x: px,
        y: 0, // Base at ground level
        z: pz,
        height,
        rotY: 0,
        lean: (seededRandom(seed + 1) - 0.5) * 0.5,
        color: new Color(plant.color),
      });
    });
    
    return data;
  }, [grassPlants, bladePlants, worldWidth, worldHeight]);
  
  // Set initial positions
  useEffect(() => {
    if (!meshRef.current) return;
    
    bladeData.forEach((blade, i) => {
      dummy.position.set(blade.x, blade.y, blade.z);
      dummy.rotation.set(0, blade.rotY, blade.lean);
      dummy.scale.set(1, blade.height, 1);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [bladeData, dummy]);
  
  // Animate wind - rotation from base means gentler angles for natural sway
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    bladeData.forEach((blade, i) => {
      const wind = Math.sin(time * 1.2 + blade.x * 3 + blade.z * 2) * 0.08;
      
      dummy.position.set(blade.x, blade.y, blade.z);
      dummy.rotation.set(wind * 0.2, blade.rotY, blade.lean + wind);
      dummy.scale.set(1, blade.height, 1);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  if (totalInstances === 0) return null;
  
  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, totalInstances]}
      frustumCulled={true}
    />
  );
}
