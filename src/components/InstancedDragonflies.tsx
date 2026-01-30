import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { 
  InstancedMesh, 
  Object3D, 
  Color, 
  SphereGeometry, 
  CylinderGeometry,
  PlaneGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  DoubleSide,
} from 'three';
import type { Creature } from '../world/types';

interface InstancedDragonfliesProps {
  creatures: Creature[];
  worldWidth: number;
  worldHeight: number;
}

function toSceneCoords(x: number, y: number, worldWidth: number, worldHeight: number): [number, number, number] {
  const sceneX = (x / worldWidth - 0.5) * 21;
  const sceneZ = (y / worldHeight - 0.5) * 21;
  return [sceneX, 0, sceneZ];
}

export function InstancedDragonflies({ creatures, worldWidth, worldHeight }: InstancedDragonfliesProps) {
  const dragonflies = creatures.filter(c => c.type === 'dragonfly');
  const count = dragonflies.length;
  
  // Refs for body parts
  const headRef = useRef<InstancedMesh>(null);
  const eyeLeftRef = useRef<InstancedMesh>(null);
  const eyeRightRef = useRef<InstancedMesh>(null);
  const thoraxRef = useRef<InstancedMesh>(null);
  const abdomenRef = useRef<InstancedMesh>(null);
  const abdomenTipRef = useRef<InstancedMesh>(null);
  const wingFLRef = useRef<InstancedMesh>(null); // Front left
  const wingFRRef = useRef<InstancedMesh>(null); // Front right
  const wingBLRef = useRef<InstancedMesh>(null); // Back left
  const wingBRRef = useRef<InstancedMesh>(null); // Back right
  
  const dummy = useMemo(() => new Object3D(), []);
  
  // Geometries
  const geometries = useMemo(() => {
    // Pre-rotate cylinders to extend along Z axis instead of Y
    const abdomen = new CylinderGeometry(0.018, 0.025, 0.25, 6);
    abdomen.rotateX(Math.PI / 2);
    
    const abdomenTip = new CylinderGeometry(0.008, 0.018, 0.1, 5);
    abdomenTip.rotateX(Math.PI / 2);
    
    return {
      head: new SphereGeometry(0.04, 8, 6),
      eye: new SphereGeometry(0.028, 6, 5),
      thorax: new SphereGeometry(0.05, 8, 6),
      abdomen,
      abdomenTip,
      wing: (() => {
        // Create wing lying flat in XZ plane, extending along +X from origin
        const g = new PlaneGeometry(0.32, 0.06, 1, 1);
        g.rotateX(-Math.PI / 2); // Lay flat in XZ plane (was in XY)
        g.translate(0.16, 0, 0); // Base at origin, extends along +X
        // Taper the wing - narrower at base, wider at tip
        const pos = g.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          // Taper based on distance from origin
          const taper = 0.3 + (x / 0.32) * 0.7;
          pos.setZ(i, z * taper);
        }
        pos.needsUpdate = true;
        return g;
      })(),
    };
  }, []);
  
  // Materials
  const bodyMaterial = useMemo(() => new MeshStandardMaterial({ 
    roughness: 0.4,
    metalness: 0.3,
  }), []);
  
  const eyeMaterial = useMemo(() => new MeshStandardMaterial({ 
    color: '#1a1a2e',
    roughness: 0.3,
    metalness: 0.5,
  }), []);
  
  const wingMaterial = useMemo(() => new MeshBasicMaterial({ 
    color: '#ffffff',
    transparent: true,
    opacity: 0.3,
    side: DoubleSide,
  }), []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach(g => g.dispose());
      bodyMaterial.dispose();
      eyeMaterial.dispose();
      wingMaterial.dispose();
    };
  }, [geometries, bodyMaterial, eyeMaterial, wingMaterial]);
  
  // Animate dragonflies
  useFrame((state) => {
    if (!headRef.current || !thoraxRef.current || !abdomenRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    dragonflies.forEach((df, i) => {
      const [x, , z] = toSceneCoords(df.pos.x, df.pos.y, worldWidth, worldHeight);
      const scale = df.size / 5;
      const rotation = Math.atan2(df.vel.x, df.vel.y);
      
      // Hover height with bobbing
      const baseHeight = 2.5 + Math.sin(df.pos.x * 0.3) * 0.8;
      const hover = Math.sin(time * 2.5 + i * 2) * 0.15;
      const y = baseHeight + hover;
      
      // Slight body tilt during hover
      const tiltX = Math.sin(time * 1.8 + i) * 0.1;
      const tiltZ = Math.cos(time * 2.2 + i * 1.5) * 0.08;
      
      const color = new Color(df.color);
      
      // Head - front of body
      dummy.position.set(
        x + Math.sin(rotation) * 0.08 * scale,
        y,
        z + Math.cos(rotation) * 0.08 * scale
      );
      dummy.rotation.set(tiltX, rotation, tiltZ);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      headRef.current!.setMatrixAt(i, dummy.matrix);
      headRef.current!.setColorAt(i, color);
      
      // Eyes - large, on sides of head
      const headX = x + Math.sin(rotation) * 0.08 * scale;
      const headZ = z + Math.cos(rotation) * 0.08 * scale;
      
      // Left eye
      dummy.position.set(
        headX + Math.cos(rotation) * 0.03 * scale,
        y + 0.01 * scale,
        headZ - Math.sin(rotation) * 0.03 * scale
      );
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      eyeLeftRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Right eye
      dummy.position.set(
        headX - Math.cos(rotation) * 0.03 * scale,
        y + 0.01 * scale,
        headZ + Math.sin(rotation) * 0.03 * scale
      );
      dummy.updateMatrix();
      eyeRightRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Thorax - bulky middle
      dummy.position.set(x, y - 0.02 * scale, z);
      dummy.rotation.set(tiltX, rotation, tiltZ);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      thoraxRef.current!.setMatrixAt(i, dummy.matrix);
      thoraxRef.current!.setColorAt(i, color);
      
      // Abdomen - long, thin, extends back (geometry pre-rotated to extend along Z)
      dummy.position.set(
        x - Math.sin(rotation) * 0.15 * scale,
        y - 0.03 * scale,
        z - Math.cos(rotation) * 0.15 * scale
      );
      dummy.rotation.set(tiltX * 0.5, rotation, tiltZ * 0.5);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      abdomenRef.current!.setMatrixAt(i, dummy.matrix);
      abdomenRef.current!.setColorAt(i, color);
      
      // Abdomen tip
      dummy.position.set(
        x - Math.sin(rotation) * 0.32 * scale,
        y - 0.04 * scale,
        z - Math.cos(rotation) * 0.32 * scale
      );
      dummy.rotation.set(tiltX * 0.3, rotation, tiltZ * 0.3);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      abdomenTipRef.current!.setMatrixAt(i, dummy.matrix);
      abdomenTipRef.current!.setColorAt(i, color);
      
      // Wings attach to thorax, extend perpendicular to body (left & right)
      // Wing geometry extends along +X from origin, flat in XZ plane
      const flutter = Math.sin(time * 40 + i * 5) * 0.2;
      const wingY = y + 0.02 * scale;
      
      // rotation = direction body faces (from atan2)
      // Left wing extends perpendicular-left: rotation.y = body_rotation
      // Right wing extends perpendicular-right: rotation.y = body_rotation + PI
      
      // Front left wing
      dummy.position.set(x, wingY, z);
      dummy.rotation.set(0, rotation, flutter);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      wingFLRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Front right wing
      dummy.position.set(x, wingY, z);
      dummy.rotation.set(0, rotation + Math.PI, -flutter);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      wingFRRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Back left wing - slightly behind along body axis
      const backOffsetX = -Math.sin(rotation) * 0.04 * scale;
      const backOffsetZ = -Math.cos(rotation) * 0.04 * scale;
      dummy.position.set(x + backOffsetX, wingY, z + backOffsetZ);
      dummy.rotation.set(0, rotation, flutter * 0.95);
      dummy.scale.setScalar(scale * 0.9);
      dummy.updateMatrix();
      wingBLRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Back right wing
      dummy.position.set(x + backOffsetX, wingY, z + backOffsetZ);
      dummy.rotation.set(0, rotation + Math.PI, -flutter * 0.95);
      dummy.scale.setScalar(scale * 0.9);
      dummy.updateMatrix();
      wingBRRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    // Update all matrices
    headRef.current.instanceMatrix.needsUpdate = true;
    eyeLeftRef.current!.instanceMatrix.needsUpdate = true;
    eyeRightRef.current!.instanceMatrix.needsUpdate = true;
    thoraxRef.current.instanceMatrix.needsUpdate = true;
    abdomenRef.current.instanceMatrix.needsUpdate = true;
    abdomenTipRef.current!.instanceMatrix.needsUpdate = true;
    wingFLRef.current!.instanceMatrix.needsUpdate = true;
    wingFRRef.current!.instanceMatrix.needsUpdate = true;
    wingBLRef.current!.instanceMatrix.needsUpdate = true;
    wingBRRef.current!.instanceMatrix.needsUpdate = true;
    
    if (headRef.current.instanceColor) headRef.current.instanceColor.needsUpdate = true;
    if (thoraxRef.current.instanceColor) thoraxRef.current.instanceColor.needsUpdate = true;
    if (abdomenRef.current.instanceColor) abdomenRef.current.instanceColor.needsUpdate = true;
    if (abdomenTipRef.current!.instanceColor) abdomenTipRef.current!.instanceColor.needsUpdate = true;
  });
  
  if (count === 0) return null;
  
  return (
    <group>
      <instancedMesh ref={headRef} args={[geometries.head, bodyMaterial, count]} frustumCulled />
      <instancedMesh ref={eyeLeftRef} args={[geometries.eye, eyeMaterial, count]} frustumCulled />
      <instancedMesh ref={eyeRightRef} args={[geometries.eye, eyeMaterial, count]} frustumCulled />
      <instancedMesh ref={thoraxRef} args={[geometries.thorax, bodyMaterial, count]} frustumCulled />
      <instancedMesh ref={abdomenRef} args={[geometries.abdomen, bodyMaterial, count]} frustumCulled />
      <instancedMesh ref={abdomenTipRef} args={[geometries.abdomenTip, bodyMaterial, count]} frustumCulled />
      <instancedMesh ref={wingFLRef} args={[geometries.wing, wingMaterial, count]} frustumCulled />
      <instancedMesh ref={wingFRRef} args={[geometries.wing, wingMaterial, count]} frustumCulled />
      <instancedMesh ref={wingBLRef} args={[geometries.wing, wingMaterial, count]} frustumCulled />
      <instancedMesh ref={wingBRRef} args={[geometries.wing, wingMaterial, count]} frustumCulled />
    </group>
  );
}
