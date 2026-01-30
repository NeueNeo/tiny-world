import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { 
  InstancedMesh, 
  Object3D, 
  Color, 
  SphereGeometry, 
  CylinderGeometry,
  MeshStandardMaterial,
} from 'three';
import type { Creature } from '../world/types';

interface InstancedCreaturesProps {
  creatures: Creature[];
  worldWidth: number;
  worldHeight: number;
}

function toSceneCoords(x: number, y: number, worldWidth: number, worldHeight: number): [number, number, number] {
  const sceneX = (x / worldWidth - 0.5) * 24;
  const sceneZ = (y / worldHeight - 0.5) * 24;
  return [sceneX, 0, sceneZ];
}

// Instanced Ants - all ants share the same geometries
export function InstancedAnts({ creatures, worldWidth, worldHeight }: InstancedCreaturesProps) {
  const ants = creatures.filter(c => c.type === 'ant');
  const count = ants.length;
  
  // Refs for each body part's instanced mesh
  const headRef = useRef<InstancedMesh>(null);
  const thoraxRef = useRef<InstancedMesh>(null);
  const petioleRef = useRef<InstancedMesh>(null);
  const abdomenRef = useRef<InstancedMesh>(null);
  const legsRef = useRef<InstancedMesh>(null);
  
  const dummy = useMemo(() => new Object3D(), []);
  
  // Shared geometries - created once, reused for all instances
  const geometries = useMemo(() => ({
    head: new SphereGeometry(0.02, 6, 6),
    thorax: new SphereGeometry(0.022, 6, 6),
    petiole: new SphereGeometry(0.008, 4, 4),
    abdomen: new SphereGeometry(0.03, 8, 6),
    leg: new CylinderGeometry(0.002, 0.0015, 0.04, 4),
  }), []);
  
  // Shared material - one for all ant parts
  const material = useMemo(() => new MeshStandardMaterial({ 
    color: '#1a1a1a',
    roughness: 0.6,
  }), []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach(g => g.dispose());
      material.dispose();
    };
  }, [geometries, material]);
  
  // Store ant data for animation (prepared for per-instance colors if needed)
  const _antData = useMemo(() => {
    return ants.map((ant, i) => ({
      index: i,
      id: ant.id,
      color: new Color(ant.color),
      scale: ant.size / 4,
    }));
  }, [ants]);
  void _antData; // Reserved for future per-instance coloring
  
  // Update instance matrices each frame
  useFrame((state) => {
    if (!headRef.current || !thoraxRef.current || !petioleRef.current || 
        !abdomenRef.current || !legsRef.current) return;
    
    const time = state.clock.elapsedTime;
    const antLen = ants.length;
    
    for (let i = 0; i < antLen; i++) {
      const ant = ants[i];
      const [x, , z] = toSceneCoords(ant.pos.x, ant.pos.y, worldWidth, worldHeight);
      const scale = ant.size / 4;
      const rotation = Math.atan2(ant.vel.x, ant.vel.y);
      const bob = Math.sin(time * 20 + ant.pos.x) * 0.003;
      const baseY = 0.01 + bob;
      
      // Head
      dummy.position.set(x, baseY + 0.015 * scale, z);
      dummy.position.x += Math.sin(rotation) * 0.045 * scale;
      dummy.position.z += Math.cos(rotation) * 0.045 * scale;
      dummy.rotation.set(0, rotation, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      headRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Thorax
      dummy.position.set(x, baseY + 0.018 * scale, z);
      dummy.position.x += Math.sin(rotation) * 0.015 * scale;
      dummy.position.z += Math.cos(rotation) * 0.015 * scale;
      dummy.rotation.set(0, rotation, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      thoraxRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Petiole (waist)
      dummy.position.set(x, baseY + 0.015 * scale, z);
      dummy.position.x -= Math.sin(rotation) * 0.01 * scale;
      dummy.position.z -= Math.cos(rotation) * 0.01 * scale;
      dummy.rotation.set(0, rotation, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      petioleRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Abdomen
      dummy.position.set(x, baseY + 0.02 * scale, z);
      dummy.position.x -= Math.sin(rotation) * 0.045 * scale;
      dummy.position.z -= Math.cos(rotation) * 0.045 * scale;
      dummy.rotation.set(0, rotation, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      abdomenRef.current!.setMatrixAt(i, dummy.matrix);
    }
    
    headRef.current.instanceMatrix.needsUpdate = true;
    thoraxRef.current.instanceMatrix.needsUpdate = true;
    petioleRef.current.instanceMatrix.needsUpdate = true;
    abdomenRef.current.instanceMatrix.needsUpdate = true;
    
    // Legs - 6 per ant = count * 6 instances
    let legIndex = 0;
    for (let i = 0; i < antLen; i++) {
      const ant = ants[i];
      const [x, , z] = toSceneCoords(ant.pos.x, ant.pos.y, worldWidth, worldHeight);
      const scale = ant.size / 4;
      const rotation = Math.atan2(ant.vel.x, ant.vel.y);
      const bob = Math.sin(time * 20 + ant.pos.x) * 0.003;
      const baseY = 0.01 + bob;
      
      // 6 legs at different angles
      const legOffsets = [
        { angle: 0.3, zOff: 0.025, rot: 0.8 },
        { angle: -0.3, zOff: 0.025, rot: -0.8 },
        { angle: 0, zOff: 0.012, rot: 0.9 },
        { angle: 0, zOff: 0.012, rot: -0.9 },
        { angle: -0.3, zOff: -0.005, rot: 0.7 },
        { angle: 0.3, zOff: -0.005, rot: -0.7 },
      ];
      
      for (let l = 0; l < 6; l++) {
        const leg = legOffsets[l];
        const legX = x + Math.sin(rotation + leg.angle) * 0.02 * scale;
        const legZ = z + Math.cos(rotation + leg.angle) * leg.zOff * scale;
        
        dummy.position.set(legX, baseY, legZ);
        dummy.rotation.set(0, rotation, leg.rot);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        legsRef.current!.setMatrixAt(legIndex++, dummy.matrix);
      }
    }
    
    legsRef.current.instanceMatrix.needsUpdate = true;
  });
  
  if (count === 0) return null;
  
  return (
    <group>
      {/* Head - one instance per ant */}
      <instancedMesh ref={headRef} args={[geometries.head, material, count]} frustumCulled />
      
      {/* Thorax */}
      <instancedMesh ref={thoraxRef} args={[geometries.thorax, material, count]} frustumCulled />
      
      {/* Petiole (waist) */}
      <instancedMesh ref={petioleRef} args={[geometries.petiole, material, count]} frustumCulled />
      
      {/* Abdomen */}
      <instancedMesh ref={abdomenRef} args={[geometries.abdomen, material, count]} frustumCulled />
      
      {/* Legs - 6 per ant */}
      <instancedMesh ref={legsRef} args={[geometries.leg, material, count * 6]} frustumCulled />
    </group>
  );
}

// Instanced Bugs (Beetles)
export function InstancedBugs({ creatures, worldWidth, worldHeight }: InstancedCreaturesProps) {
  const bugs = creatures.filter(c => c.type === 'bug');
  const count = bugs.length;
  
  const bodyRef = useRef<InstancedMesh>(null);
  const headRef = useRef<InstancedMesh>(null);
  const legsRef = useRef<InstancedMesh>(null);
  
  const dummy = useMemo(() => new Object3D(), []);
  
  // Shared geometries
  const geometries = useMemo(() => ({
    body: new SphereGeometry(0.08, 8, 8),
    head: new SphereGeometry(0.05, 6, 6),
    leg: new CylinderGeometry(0.008, 0.008, 0.06, 4),
  }), []);
  
  // Materials - body uses creature color, legs are dark
  const legMaterial = useMemo(() => new MeshStandardMaterial({ 
    color: '#1a1a1a',
    roughness: 0.7,
  }), []);
  
  const bodyMaterial = useMemo(() => new MeshStandardMaterial({ 
    color: '#5d4e37', // Default brown, will be overridden per-instance if we add color support
    roughness: 0.7,
  }), []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach(g => g.dispose());
      legMaterial.dispose();
      bodyMaterial.dispose();
    };
  }, [geometries, legMaterial, bodyMaterial]);
  
  // Update each frame
  useFrame((state) => {
    if (!bodyRef.current || !headRef.current || !legsRef.current) return;
    
    const time = state.clock.elapsedTime;
    const bugLen = bugs.length;
    
    for (let i = 0; i < bugLen; i++) {
      const bug = bugs[i];
      const [x, , z] = toSceneCoords(bug.pos.x, bug.pos.y, worldWidth, worldHeight);
      const scale = bug.size / 2.5;
      const rotation = Math.atan2(bug.vel.x, bug.vel.y);
      const bob = Math.sin(time * 8) * 0.01;
      const baseY = 0.05 + bob;
      
      // Body
      dummy.position.set(x, baseY, z);
      dummy.rotation.set(0, rotation, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      bodyRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Head - offset forward
      dummy.position.set(
        x + Math.sin(rotation) * 0.08 * scale,
        baseY,
        z + Math.cos(rotation) * 0.08 * scale
      );
      dummy.rotation.set(0, rotation, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      headRef.current!.setMatrixAt(i, dummy.matrix);
    }
    
    bodyRef.current.instanceMatrix.needsUpdate = true;
    headRef.current.instanceMatrix.needsUpdate = true;
    
    // Legs - 6 per bug
    let legIndex = 0;
    for (let i = 0; i < bugLen; i++) {
      const bug = bugs[i];
      const [x, , z] = toSceneCoords(bug.pos.x, bug.pos.y, worldWidth, worldHeight);
      const scale = bug.size / 2.5;
      const rotation = Math.atan2(bug.vel.x, bug.vel.y);
      const bob = Math.sin(time * 8) * 0.01;
      const baseY = 0.05 + bob - 0.02;
      
      // 3 pairs of legs
      const pairs = [-1, 0, 1];
      for (let p = 0; p < 3; p++) {
        const pair = pairs[p];
        // Right leg
        const rX = x + Math.cos(rotation) * 0.06 * scale;
        const rZ = z - Math.sin(rotation) * 0.06 * scale + Math.cos(rotation) * pair * 0.03 * scale;
        dummy.position.set(rX, baseY, rZ);
        dummy.rotation.set(0, rotation, 0.5);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        legsRef.current!.setMatrixAt(legIndex++, dummy.matrix);
        
        // Left leg
        const lX = x - Math.cos(rotation) * 0.06 * scale;
        const lZ = z + Math.sin(rotation) * 0.06 * scale + Math.cos(rotation) * pair * 0.03 * scale;
        dummy.position.set(lX, baseY, lZ);
        dummy.rotation.set(0, rotation, -0.5);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        legsRef.current!.setMatrixAt(legIndex++, dummy.matrix);
      }
    }
    
    legsRef.current.instanceMatrix.needsUpdate = true;
  });
  
  if (count === 0) return null;
  
  return (
    <group>
      <instancedMesh ref={bodyRef} args={[geometries.body, bodyMaterial, count]} frustumCulled />
      <instancedMesh ref={headRef} args={[geometries.head, bodyMaterial, count]} frustumCulled />
      <instancedMesh ref={legsRef} args={[geometries.leg, legMaterial, count * 6]} frustumCulled />
    </group>
  );
}

// Instanced Caterpillars
export function InstancedCaterpillars({ creatures, worldWidth, worldHeight }: InstancedCreaturesProps) {
  const caterpillars = creatures.filter(c => c.type === 'caterpillar');
  const count = caterpillars.length;
  
  // 6 segments per caterpillar
  const segmentsRef = useRef<InstancedMesh>(null);
  const eyesRef = useRef<InstancedMesh>(null);
  
  const dummy = useMemo(() => new Object3D(), []);
  
  const geometries = useMemo(() => ({
    segment: new SphereGeometry(0.025, 6, 5),
    eye: new SphereGeometry(0.008, 4, 4),
  }), []);
  
  const segmentMaterial = useMemo(() => new MeshStandardMaterial({ 
    color: '#7cb342',
    roughness: 0.7,
  }), []);
  
  const eyeMaterial = useMemo(() => new MeshStandardMaterial({ 
    color: '#1a1a1a',
  }), []);
  
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach(g => g.dispose());
      segmentMaterial.dispose();
      eyeMaterial.dispose();
    };
  }, [geometries, segmentMaterial, eyeMaterial]);
  
  useFrame((state) => {
    if (!segmentsRef.current || !eyesRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // 6 segments per caterpillar
    let segIndex = 0;
    let eyeIndex = 0;
    
    const catLen = caterpillars.length;
    for (let c = 0; c < catLen; c++) {
      const cat = caterpillars[c];
      const [x, , z] = toSceneCoords(cat.pos.x, cat.pos.y, worldWidth, worldHeight);
      const scale = cat.size / 3;
      const rotation = Math.atan2(cat.vel.x, cat.vel.y);
      
      // 6 body segments - head first, then trailing behind
      for (let i = 0; i < 6; i++) {
        const wave = Math.sin(time * 3 - i * 0.8) * 0.015;
        const segZ = i * 0.055 * scale;
        const radius = i === 0 ? 1.2 : (1 - i * 0.08);
        
        dummy.position.set(
          x - Math.sin(rotation) * segZ,
          0.02 + wave,
          z - Math.cos(rotation) * segZ
        );
        dummy.rotation.set(0, rotation, 0);
        dummy.scale.set(scale * radius, scale * radius, scale * radius);
        dummy.updateMatrix();
        segmentsRef.current!.setMatrixAt(segIndex++, dummy.matrix);
      }
      
      // 2 eyes on head
      for (let e = 0; e < 2; e++) {
        const side = e === 0 ? -1 : 1;
        dummy.position.set(
          x + Math.cos(rotation) * 0.018 * scale * side + Math.sin(rotation) * 0.02 * scale,
          0.035 * scale + 0.02,
          z - Math.sin(rotation) * 0.018 * scale * side + Math.cos(rotation) * 0.02 * scale
        );
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        eyesRef.current!.setMatrixAt(eyeIndex++, dummy.matrix);
      }
    }
    
    segmentsRef.current.instanceMatrix.needsUpdate = true;
    eyesRef.current.instanceMatrix.needsUpdate = true;
  });
  
  if (count === 0) return null;
  
  return (
    <group>
      <instancedMesh ref={segmentsRef} args={[geometries.segment, segmentMaterial, count * 6]} frustumCulled />
      <instancedMesh ref={eyesRef} args={[geometries.eye, eyeMaterial, count * 2]} frustumCulled />
    </group>
  );
}

// Instanced Butterflies
export function InstancedButterflies({ creatures, worldWidth, worldHeight }: InstancedCreaturesProps) {
  const butterflies = creatures.filter(c => c.type === 'butterfly');
  const count = butterflies.length;
  
  const bodyRef = useRef<InstancedMesh>(null);
  const wingsRef = useRef<InstancedMesh>(null);
  
  const dummy = useMemo(() => new Object3D(), []);
  
  const geometries = useMemo(() => ({
    body: new CylinderGeometry(0.015, 0.012, 0.12, 6),
    wing: (() => {
      const g = new SphereGeometry(0.1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
      g.scale(1.8, 0.1, 1);
      return g;
    })(),
  }), []);
  
  const bodyMaterial = useMemo(() => new MeshStandardMaterial({ 
    color: '#2a2a2a',
    roughness: 0.6,
  }), []);
  
  const wingMaterial = useMemo(() => new MeshStandardMaterial({ 
    color: '#ffb6c1',
    roughness: 0.3,
    transparent: true,
    opacity: 0.85,
    side: 2, // DoubleSide
  }), []);
  
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach(g => g.dispose());
      bodyMaterial.dispose();
      wingMaterial.dispose();
    };
  }, [geometries, bodyMaterial, wingMaterial]);
  
  useFrame((state) => {
    if (!bodyRef.current || !wingsRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    let wingIndex = 0;
    const bfLen = butterflies.length;
    
    for (let i = 0; i < bfLen; i++) {
      const bf = butterflies[i];
      const [x, , z] = toSceneCoords(bf.pos.x, bf.pos.y, worldWidth, worldHeight);
      const scale = bf.size / 3;
      const rotation = Math.atan2(bf.vel.x, bf.vel.y);
      
      // Float high with bobbing
      const baseHeight = 3 + Math.sin(bf.pos.x * 0.5) * 0.5;
      const bob = Math.sin(time * 1.5 + bf.pos.x) * 0.3;
      const y = baseHeight + bob;
      
      // Body
      dummy.position.set(x, y, z);
      dummy.rotation.set(Math.PI / 2, rotation, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      bodyRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Wings - flapping animation
      const flap = Math.sin(time * 12 + i) * 1.2;
      
      // Right wing
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, rotation, 0.1 + flap);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      wingsRef.current!.setMatrixAt(wingIndex++, dummy.matrix);
      
      // Left wing
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, rotation, -0.1 - flap);
      dummy.scale.set(-scale, scale, scale); // Mirror
      dummy.updateMatrix();
      wingsRef.current!.setMatrixAt(wingIndex++, dummy.matrix);
    }
    
    bodyRef.current.instanceMatrix.needsUpdate = true;
    wingsRef.current.instanceMatrix.needsUpdate = true;
  });
  
  if (count === 0) return null;
  
  return (
    <group>
      <instancedMesh ref={bodyRef} args={[geometries.body, bodyMaterial, count]} frustumCulled />
      <instancedMesh ref={wingsRef} args={[geometries.wing, wingMaterial, count * 2]} frustumCulled />
    </group>
  );
}

// Instanced Snails
export function InstancedSnails({ creatures, worldWidth, worldHeight }: InstancedCreaturesProps) {
  const snails = creatures.filter(c => c.type === 'snail');
  const count = snails.length;
  
  const shellRef = useRef<InstancedMesh>(null);
  const bodyRef = useRef<InstancedMesh>(null);
  const eyeStalksRef = useRef<InstancedMesh>(null);
  const eyesRef = useRef<InstancedMesh>(null);
  
  const dummy = useMemo(() => new Object3D(), []);
  
  const geometries = useMemo(() => ({
    shell: new SphereGeometry(0.12, 12, 12),
    body: new CylinderGeometry(0.03, 0.03, 0.12, 8),
    eyeStalk: new CylinderGeometry(0.008, 0.008, 0.08, 4),
    eye: new SphereGeometry(0.015, 6, 6),
  }), []);
  
  const shellMaterial = useMemo(() => new MeshStandardMaterial({ 
    color: '#deb887',
    roughness: 0.5,
  }), []);
  
  const bodyMaterial = useMemo(() => new MeshStandardMaterial({ 
    color: '#9a8b7a',
    roughness: 0.8,
  }), []);
  
  const eyeMaterial = useMemo(() => new MeshStandardMaterial({ 
    color: '#1a1a1a',
  }), []);
  
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach(g => g.dispose());
      shellMaterial.dispose();
      bodyMaterial.dispose();
      eyeMaterial.dispose();
    };
  }, [geometries, shellMaterial, bodyMaterial, eyeMaterial]);
  
  // Snails are slow - 30fps animation is plenty
  const snailFrameRef = useRef(0);
  useFrame(() => {
    snailFrameRef.current++;
    if (snailFrameRef.current % 2 !== 0) return;
    if (!shellRef.current || !bodyRef.current || !eyeStalksRef.current || !eyesRef.current) return;
    
    let stalkIndex = 0;
    let eyeIndex = 0;
    const len = snails.length;
    
    for (let i = 0; i < len; i++) {
      const snail = snails[i];
      const [x, , z] = toSceneCoords(snail.pos.x, snail.pos.y, worldWidth, worldHeight);
      const scale = snail.size / 6;
      const rotation = Math.atan2(snail.vel.x, snail.vel.y);
      const baseY = 0.04;
      
      // Shell - offset back
      dummy.position.set(
        x - Math.sin(rotation) * 0.05 * scale,
        baseY + 0.08 * scale,
        z - Math.cos(rotation) * 0.05 * scale
      );
      dummy.rotation.set(0, rotation, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      shellRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Body - offset forward
      dummy.position.set(
        x + Math.sin(rotation) * 0.05 * scale,
        baseY,
        z + Math.cos(rotation) * 0.05 * scale
      );
      dummy.rotation.set(0, 0, Math.PI / 2);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      bodyRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Eye stalks - 2 per snail
      for (let s = 0; s < 2; s++) {
        const side = s === 0 ? -1 : 1;
        dummy.position.set(
          x + Math.sin(rotation) * 0.1 * scale + Math.cos(rotation) * 0.02 * side * scale,
          baseY + 0.06 * scale,
          z + Math.cos(rotation) * 0.1 * scale - Math.sin(rotation) * 0.02 * side * scale
        );
        dummy.rotation.set(0, rotation, 0);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        eyeStalksRef.current!.setMatrixAt(stalkIndex++, dummy.matrix);
        
        // Eyes on top of stalks
        dummy.position.set(
          x + Math.sin(rotation) * 0.1 * scale + Math.cos(rotation) * 0.02 * side * scale,
          baseY + 0.1 * scale,
          z + Math.cos(rotation) * 0.1 * scale - Math.sin(rotation) * 0.02 * side * scale
        );
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        eyesRef.current!.setMatrixAt(eyeIndex++, dummy.matrix);
      }
    }
    
    shellRef.current.instanceMatrix.needsUpdate = true;
    bodyRef.current.instanceMatrix.needsUpdate = true;
    eyeStalksRef.current.instanceMatrix.needsUpdate = true;
    eyesRef.current.instanceMatrix.needsUpdate = true;
  });
  
  if (count === 0) return null;
  
  return (
    <group>
      <instancedMesh ref={shellRef} args={[geometries.shell, shellMaterial, count]} frustumCulled />
      <instancedMesh ref={bodyRef} args={[geometries.body, bodyMaterial, count]} frustumCulled />
      <instancedMesh ref={eyeStalksRef} args={[geometries.eyeStalk, bodyMaterial, count * 2]} frustumCulled />
      <instancedMesh ref={eyesRef} args={[geometries.eye, eyeMaterial, count * 2]} frustumCulled />
    </group>
  );
}
