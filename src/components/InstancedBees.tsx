import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { 
  InstancedMesh, 
  Object3D, 
  Color, 
  SphereGeometry, 
  PlaneGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  DoubleSide,
} from 'three';
import type { Creature } from '../world/types';

interface InstancedBeesProps {
  creatures: Creature[];
  worldWidth: number;
  worldHeight: number;
}

function toSceneCoords(x: number, y: number, worldWidth: number, worldHeight: number): [number, number, number] {
  const sceneX = (x / worldWidth - 0.5) * 24;
  const sceneZ = (y / worldHeight - 0.5) * 24;
  return [sceneX, 0, sceneZ];
}

export function InstancedBees({ creatures, worldWidth, worldHeight }: InstancedBeesProps) {
  const bees = useMemo(() => creatures.filter(c => c.type === 'bee'), [creatures]);
  const count = bees.length;
  
  // Refs for body parts
  const headRef = useRef<InstancedMesh>(null);
  const thoraxRef = useRef<InstancedMesh>(null);
  const abdomenRef = useRef<InstancedMesh>(null);
  const stripeRef = useRef<InstancedMesh>(null);
  const wingLRef = useRef<InstancedMesh>(null);
  const wingRRef = useRef<InstancedMesh>(null);
  
  const dummy = useMemo(() => new Object3D(), []);
  
  // Geometries
  const geometries = useMemo(() => {
    // Small wing - flat in XZ plane, extends along +X
    const wing = new PlaneGeometry(0.08, 0.035, 1, 1);
    wing.rotateX(-Math.PI / 2);
    wing.translate(0.04, 0, 0);
    
    return {
      head: new SphereGeometry(0.025, 6, 5),
      thorax: new SphereGeometry(0.035, 7, 5),
      abdomen: new SphereGeometry(0.045, 8, 6),
      stripe: new SphereGeometry(0.046, 8, 4, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.15), // Ring stripe
      wing,
    };
  }, []);
  
  // Materials
  const headMaterial = useMemo(() => new MeshStandardMaterial({ 
    color: '#1a1a1a',
    roughness: 0.6,
  }), []);
  
  const thoraxMaterial = useMemo(() => new MeshStandardMaterial({ 
    color: '#8B7355', // Fuzzy brown
    roughness: 0.9,
  }), []);
  
  const abdomenMaterial = useMemo(() => new MeshStandardMaterial({ 
    roughness: 0.7,
  }), []);
  
  const stripeMaterial = useMemo(() => new MeshStandardMaterial({ 
    color: '#1a1a1a',
    roughness: 0.7,
  }), []);
  
  const wingMaterial = useMemo(() => new MeshBasicMaterial({ 
    color: '#ffffff',
    transparent: true,
    opacity: 0.35,
    side: DoubleSide,
  }), []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach(g => g.dispose());
      headMaterial.dispose();
      thoraxMaterial.dispose();
      abdomenMaterial.dispose();
      stripeMaterial.dispose();
      wingMaterial.dispose();
    };
  }, [geometries, headMaterial, thoraxMaterial, abdomenMaterial, stripeMaterial, wingMaterial]);
  
  // Reusable color object to avoid allocations
  const tempColor = useMemo(() => new Color(), []);
  
  // Animate bees
  useFrame((state) => {
    if (!headRef.current || !thoraxRef.current || !abdomenRef.current) return;
    
    const time = state.clock.elapsedTime;
    const len = bees.length;
    
    for (let i = 0; i < len; i++) {
      const bee = bees[i];
      const [x, , z] = toSceneCoords(bee.pos.x, bee.pos.y, worldWidth, worldHeight);
      const scale = bee.size / 3;
      const rotation = Math.atan2(bee.vel.x, bee.vel.y);
      
      // Hover height with quick bobbing (bees buzz erratically)
      const baseHeight = 1.5 + Math.sin(bee.pos.x * 0.5 + bee.pos.y * 0.3) * 0.5;
      const hover = Math.sin(time * 8 + i * 3) * 0.08 + Math.sin(time * 12 + i * 5) * 0.04;
      const y = baseHeight + hover;
      
      // Slight wobble
      const wobbleX = Math.sin(time * 6 + i * 2) * 0.1;
      const wobbleZ = Math.cos(time * 7 + i * 3) * 0.08;
      
      tempColor.set(bee.color);
      
      // Head - front
      dummy.position.set(
        x + Math.sin(rotation) * 0.055 * scale,
        y,
        z + Math.cos(rotation) * 0.055 * scale
      );
      dummy.rotation.set(wobbleX, rotation, wobbleZ);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      headRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Thorax - middle (fuzzy)
      dummy.position.set(x, y, z);
      dummy.rotation.set(wobbleX, rotation, wobbleZ);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      thoraxRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Abdomen - back (striped, yellow)
      dummy.position.set(
        x - Math.sin(rotation) * 0.06 * scale,
        y - 0.01 * scale,
        z - Math.cos(rotation) * 0.06 * scale
      );
      dummy.rotation.set(wobbleX * 0.5, rotation, wobbleZ * 0.5);
      dummy.scale.set(scale * 0.9, scale * 0.8, scale * 1.1); // Slightly elongated
      dummy.updateMatrix();
      abdomenRef.current!.setMatrixAt(i, dummy.matrix);
      abdomenRef.current!.setColorAt(i, tempColor);
      
      // Black stripe on abdomen
      dummy.position.set(
        x - Math.sin(rotation) * 0.06 * scale,
        y - 0.01 * scale,
        z - Math.cos(rotation) * 0.06 * scale
      );
      dummy.rotation.set(wobbleX * 0.5 + Math.PI / 2, 0, rotation);
      dummy.scale.set(scale * 0.9, scale * 0.8, scale * 1.1);
      dummy.updateMatrix();
      stripeRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Wings - very fast beat
      const flutter = Math.sin(time * 80 + i * 10) * 0.4; // Super fast!
      const wingY = y + 0.03 * scale;
      
      // Left wing
      dummy.position.set(x, wingY, z);
      dummy.rotation.set(0, rotation, flutter);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      wingLRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Right wing
      dummy.position.set(x, wingY, z);
      dummy.rotation.set(0, rotation + Math.PI, -flutter);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      wingRRef.current!.setMatrixAt(i, dummy.matrix);
    }
    
    // Update matrices
    headRef.current.instanceMatrix.needsUpdate = true;
    thoraxRef.current.instanceMatrix.needsUpdate = true;
    abdomenRef.current.instanceMatrix.needsUpdate = true;
    stripeRef.current!.instanceMatrix.needsUpdate = true;
    wingLRef.current!.instanceMatrix.needsUpdate = true;
    wingRRef.current!.instanceMatrix.needsUpdate = true;
    
    if (abdomenRef.current.instanceColor) abdomenRef.current.instanceColor.needsUpdate = true;
  });
  
  if (count === 0) return null;
  
  return (
    <group>
      <instancedMesh ref={headRef} args={[geometries.head, headMaterial, count]} frustumCulled />
      <instancedMesh ref={thoraxRef} args={[geometries.thorax, thoraxMaterial, count]} frustumCulled />
      <instancedMesh ref={abdomenRef} args={[geometries.abdomen, abdomenMaterial, count]} frustumCulled />
      <instancedMesh ref={stripeRef} args={[geometries.stripe, stripeMaterial, count]} frustumCulled />
      <instancedMesh ref={wingLRef} args={[geometries.wing, wingMaterial, count]} frustumCulled />
      <instancedMesh ref={wingRRef} args={[geometries.wing, wingMaterial, count]} frustumCulled />
    </group>
  );
}
