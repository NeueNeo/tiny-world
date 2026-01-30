import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { 
  InstancedMesh, 
  Object3D, 
  Color, 
  CylinderGeometry,
  SphereGeometry,
  CircleGeometry,
  MeshStandardMaterial,
  DoubleSide
} from 'three';
import type { Plant } from '../world/types';

interface InstancedPlantsProps {
  plants: Plant[];
  worldWidth: number;
  worldHeight: number;
}

function toSceneCoords(x: number, y: number, worldWidth: number, worldHeight: number): [number, number, number] {
  const sceneX = (x / worldWidth - 0.5) * 24;
  const sceneZ = (y / worldHeight - 0.5) * 24;
  return [sceneX, 0, sceneZ];
}

// Instanced Flowers with actual petals - base-anchored wind animation
export function InstancedFlowers({ plants, worldWidth, worldHeight }: InstancedPlantsProps) {
  const stemRef = useRef<InstancedMesh>(null);
  const centerRef = useRef<InstancedMesh>(null);
  const petalRefs = [
    useRef<InstancedMesh>(null),
    useRef<InstancedMesh>(null),
    useRef<InstancedMesh>(null),
    useRef<InstancedMesh>(null),
    useRef<InstancedMesh>(null),
  ];
  const dummy = useMemo(() => new Object3D(), []);
  
  // Round-petal flowers (cup/dome shaped petals)
  const flowerPlants = useMemo(() => 
    plants.filter(p => p.type === 'flower' || p.type === 'tulip' || p.type === 'poppy'),
    [plants]
  );
  
  // Stem height for calculating flower head position
  const STEM_HEIGHT = 0.9;
  
  // Shared geometries - stem pivots at base
  const stemGeom = useMemo(() => {
    const geom = new CylinderGeometry(0.012, 0.018, STEM_HEIGHT, 6);
    geom.translate(0, STEM_HEIGHT / 2, 0); // Pivot at bottom
    return geom;
  }, []);
  const centerGeom = useMemo(() => new SphereGeometry(0.08, 8, 8), []);
  const petalGeom = useMemo(() => new SphereGeometry(0.12, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), []);
  
  // Materials
  const stemMat = useMemo(() => new MeshStandardMaterial({ color: '#2d5a27', roughness: 0.8 }), []);
  const centerMat = useMemo(() => new MeshStandardMaterial({ color: '#ffd93d', roughness: 0.5 }), []);
  const petalMat = useMemo(() => new MeshStandardMaterial({ roughness: 0.6, side: DoubleSide }), []);
  
  // Cleanup geometries and materials on unmount
  useEffect(() => {
    return () => {
      stemGeom.dispose();
      centerGeom.dispose();
      petalGeom.dispose();
      stemMat.dispose();
      centerMat.dispose();
      petalMat.dispose();
    };
  }, [stemGeom, centerGeom, petalGeom, stemMat, centerMat, petalMat]);
  
  // Pre-calculate flower data
  const flowerData = useMemo(() => {
    return flowerPlants.map((plant, i) => {
      const [x, , z] = toSceneCoords(plant.pos.x, plant.pos.y, worldWidth, worldHeight);
      const scale = plant.size / 6;
      return {
        x, z, scale,
        color: new Color(plant.color),
        seed: i,
      };
    });
  }, [flowerPlants, worldWidth, worldHeight]);
  
  // Set initial transforms
  useEffect(() => {
    if (!stemRef.current || !centerRef.current) return;
    
    flowerData.forEach((f, i) => {
      const stemTop = STEM_HEIGHT * f.scale;
      const headY = stemTop + 0.05 * f.scale;
      
      // Stem at ground level
      dummy.position.set(f.x, 0, f.z);
      dummy.scale.set(f.scale, f.scale, f.scale);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      stemRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Center directly on top of stem
      dummy.position.set(f.x, headY, f.z);
      dummy.scale.set(f.scale, f.scale, f.scale);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      centerRef.current!.setMatrixAt(i, dummy.matrix);
      
      // 5 petals arranged in a circle around center
      for (let p = 0; p < 5; p++) {
        const angle = (p / 5) * Math.PI * 2;
        const px = f.x + Math.cos(angle) * 0.15 * f.scale;
        const pz = f.z + Math.sin(angle) * 0.15 * f.scale;
        
        dummy.position.set(px, headY, pz);
        dummy.scale.set(f.scale, f.scale, f.scale);
        dummy.rotation.set(0.3, angle, 0);
        dummy.updateMatrix();
        petalRefs[p].current!.setMatrixAt(i, dummy.matrix);
        petalRefs[p].current!.setColorAt(i, f.color);
      }
    });
    
    stemRef.current.instanceMatrix.needsUpdate = true;
    centerRef.current.instanceMatrix.needsUpdate = true;
    petalRefs.forEach(ref => {
      if (ref.current) {
        ref.current.instanceMatrix.needsUpdate = true;
        if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
      }
    });
  }, [flowerData, dummy]);
  
  // Animate wind - base anchored, tops sway
  const frameRef = useRef(0);
  useFrame((state) => {
    frameRef.current++;
    if (frameRef.current % 2 !== 0) return; // 30fps animation
    if (!stemRef.current || !centerRef.current) return;
    
    const time = state.clock.elapsedTime;
    const len = flowerData.length;
    
    for (let i = 0; i < len; i++) {
      const f = flowerData[i];
      // Wind sway - similar to grass but gentler for flowers
      const rotX = Math.sin(time * 0.8 + f.x * 2 + f.z * 3) * 0.06;
      const rotZ = Math.sin(time * 1.0 + f.x * 3 + f.z * 2) * 0.06;
      
      const stemTop = STEM_HEIGHT * f.scale;
      
      // Stem rotates from base
      dummy.position.set(f.x, 0, f.z);
      dummy.scale.set(f.scale, f.scale, f.scale);
      dummy.rotation.set(rotX, 0, rotZ);
      dummy.updateMatrix();
      stemRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Calculate where stem tip ends up after rotation
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosZ = Math.cos(rotZ);
      const sinZ = Math.sin(rotZ);
      
      const tipLocalX = -stemTop * cosX * sinZ;
      const tipLocalY = stemTop * cosX * cosZ;
      const tipLocalZ = stemTop * sinX;
      
      const headX = f.x + tipLocalX;
      const headY = tipLocalY + 0.05 * f.scale;
      const headZ = f.z + tipLocalZ;
      
      // Center at stem tip
      dummy.position.set(headX, headY, headZ);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      centerRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Petals follow center
      for (let p = 0; p < 5; p++) {
        const angle = (p / 5) * Math.PI * 2;
        const px = headX + Math.cos(angle) * 0.15 * f.scale;
        const pz = headZ + Math.sin(angle) * 0.15 * f.scale;
        
        dummy.position.set(px, headY, pz);
        dummy.scale.set(f.scale, f.scale, f.scale);
        dummy.rotation.set(0.3, angle, 0);
        dummy.updateMatrix();
        petalRefs[p].current!.setMatrixAt(i, dummy.matrix);
      }
    }
    
    stemRef.current.instanceMatrix.needsUpdate = true;
    centerRef.current.instanceMatrix.needsUpdate = true;
    for (let r = 0; r < petalRefs.length; r++) {
      if (petalRefs[r].current) petalRefs[r].current!.instanceMatrix.needsUpdate = true;
    }
  });
  
  if (flowerData.length === 0) return null;
  
  return (
    <>
      <instancedMesh ref={stemRef} args={[stemGeom, stemMat, flowerData.length]} frustumCulled castShadow />
      <instancedMesh ref={centerRef} args={[centerGeom, centerMat, flowerData.length]} frustumCulled castShadow />
      {petalRefs.map((ref, i) => (
        <instancedMesh key={i} ref={ref} args={[petalGeom, petalMat, flowerData.length]} frustumCulled castShadow />
      ))}
    </>
  );
}

// Instanced Flat-Petal Flowers (daisies, wildflowers) - thin disc petals
export function InstancedFlatFlowers({ plants, worldWidth, worldHeight }: InstancedPlantsProps) {
  const stemRef = useRef<InstancedMesh>(null);
  const centerRef = useRef<InstancedMesh>(null);
  const petalRefs = [
    useRef<InstancedMesh>(null),
    useRef<InstancedMesh>(null),
    useRef<InstancedMesh>(null),
    useRef<InstancedMesh>(null),
    useRef<InstancedMesh>(null),
    useRef<InstancedMesh>(null),
    useRef<InstancedMesh>(null),
    useRef<InstancedMesh>(null),
  ];
  const dummy = useMemo(() => new Object3D(), []);
  
  // Flat-petal flowers (daisy, wildflower)
  const flowerPlants = useMemo(() => 
    plants.filter(p => p.type === 'daisy' || p.type === 'wildflower'),
    [plants]
  );
  
  const STEM_HEIGHT = 0.7;
  
  // Geometries - flat disc petals
  const stemGeom = useMemo(() => {
    const geom = new CylinderGeometry(0.008, 0.012, STEM_HEIGHT, 6);
    geom.translate(0, STEM_HEIGHT / 2, 0);
    return geom;
  }, []);
  const centerGeom = useMemo(() => new SphereGeometry(0.06, 8, 8), []);
  // Flat elliptical petal - thin disc
  const petalGeom = useMemo(() => new CircleGeometry(0.08, 8), []);
  
  // Materials
  const stemMat = useMemo(() => new MeshStandardMaterial({ color: '#2d5a27', roughness: 0.8 }), []);
  const centerMat = useMemo(() => new MeshStandardMaterial({ color: '#ffd700', roughness: 0.4 }), []);
  const petalMat = useMemo(() => new MeshStandardMaterial({ roughness: 0.5, side: DoubleSide }), []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stemGeom.dispose();
      centerGeom.dispose();
      petalGeom.dispose();
      stemMat.dispose();
      centerMat.dispose();
      petalMat.dispose();
    };
  }, [stemGeom, centerGeom, petalGeom, stemMat, centerMat, petalMat]);
  
  // Pre-calculate flower data
  const flowerData = useMemo(() => {
    return flowerPlants.map((plant, i) => {
      const [x, , z] = toSceneCoords(plant.pos.x, plant.pos.y, worldWidth, worldHeight);
      const scale = plant.size / 7;
      return {
        x, z, scale,
        color: new Color(plant.color),
        seed: i,
      };
    });
  }, [flowerPlants, worldWidth, worldHeight]);
  
  // Set initial transforms
  useEffect(() => {
    if (!stemRef.current || !centerRef.current) return;
    
    flowerData.forEach((f, i) => {
      const stemTop = STEM_HEIGHT * f.scale;
      const headY = stemTop + 0.03 * f.scale;
      
      // Stem
      dummy.position.set(f.x, 0, f.z);
      dummy.scale.set(f.scale, f.scale, f.scale);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      stemRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Center
      dummy.position.set(f.x, headY, f.z);
      dummy.scale.set(f.scale, f.scale, f.scale);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      centerRef.current!.setMatrixAt(i, dummy.matrix);
      
      // 8 flat petals radiating outward
      for (let p = 0; p < 8; p++) {
        const angle = (p / 8) * Math.PI * 2;
        const px = f.x + Math.cos(angle) * 0.1 * f.scale;
        const pz = f.z + Math.sin(angle) * 0.1 * f.scale;
        
        dummy.position.set(px, headY, pz);
        dummy.scale.set(f.scale, f.scale, f.scale);
        // Flat petals angled slightly upward, pointing outward
        dummy.rotation.set(Math.PI / 2 - 0.3, 0, -angle + Math.PI / 2);
        dummy.updateMatrix();
        petalRefs[p].current!.setMatrixAt(i, dummy.matrix);
        petalRefs[p].current!.setColorAt(i, f.color);
      }
    });
    
    stemRef.current.instanceMatrix.needsUpdate = true;
    centerRef.current.instanceMatrix.needsUpdate = true;
    petalRefs.forEach(ref => {
      if (ref.current) {
        ref.current.instanceMatrix.needsUpdate = true;
        if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
      }
    });
  }, [flowerData, dummy]);
  
  // Animate wind
  const frameRef2 = useRef(0);
  useFrame((state) => {
    frameRef2.current++;
    if (frameRef2.current % 2 !== 0) return; // 30fps animation
    if (!stemRef.current || !centerRef.current) return;
    
    const time = state.clock.elapsedTime;
    const len = flowerData.length;
    
    for (let i = 0; i < len; i++) {
      const f = flowerData[i];
      const rotX = Math.sin(time * 0.7 + f.x * 2 + f.z * 3) * 0.05;
      const rotZ = Math.sin(time * 0.9 + f.x * 3 + f.z * 2) * 0.05;
      
      const stemTop = STEM_HEIGHT * f.scale;
      
      // Stem sway
      dummy.position.set(f.x, 0, f.z);
      dummy.scale.set(f.scale, f.scale, f.scale);
      dummy.rotation.set(rotX, 0, rotZ);
      dummy.updateMatrix();
      stemRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Calculate stem tip position
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosZ = Math.cos(rotZ);
      const sinZ = Math.sin(rotZ);
      
      const tipLocalX = -stemTop * cosX * sinZ;
      const tipLocalY = stemTop * cosX * cosZ;
      const tipLocalZ = stemTop * sinX;
      
      const headX = f.x + tipLocalX;
      const headY = tipLocalY + 0.03 * f.scale;
      const headZ = f.z + tipLocalZ;
      
      // Center
      dummy.position.set(headX, headY, headZ);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      centerRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Petals follow center
      for (let p = 0; p < 8; p++) {
        const angle = (p / 8) * Math.PI * 2;
        const px = headX + Math.cos(angle) * 0.1 * f.scale;
        const pz = headZ + Math.sin(angle) * 0.1 * f.scale;
        
        dummy.position.set(px, headY, pz);
        dummy.scale.set(f.scale, f.scale, f.scale);
        dummy.rotation.set(Math.PI / 2 - 0.3, 0, -angle + Math.PI / 2);
        dummy.updateMatrix();
        petalRefs[p].current!.setMatrixAt(i, dummy.matrix);
      }
    }
    
    stemRef.current.instanceMatrix.needsUpdate = true;
    centerRef.current.instanceMatrix.needsUpdate = true;
    petalRefs.forEach(ref => {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    });
  });
  
  if (flowerData.length === 0) return null;
  
  return (
    <>
      <instancedMesh ref={stemRef} args={[stemGeom, stemMat, flowerData.length]} frustumCulled castShadow />
      <instancedMesh ref={centerRef} args={[centerGeom, centerMat, flowerData.length]} frustumCulled castShadow />
      {petalRefs.map((ref, i) => (
        <instancedMesh key={i} ref={ref} args={[petalGeom, petalMat, flowerData.length]} frustumCulled castShadow />
      ))}
    </>
  );
}

// Instanced Mushrooms
export function InstancedMushrooms({ plants, worldWidth, worldHeight }: InstancedPlantsProps) {
  const stemRef = useRef<InstancedMesh>(null);
  const capRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  
  const mushrooms = useMemo(() => plants.filter(p => p.type === 'mushroom'), [plants]);
  
  const stemGeom = useMemo(() => new CylinderGeometry(0.04, 0.06, 0.3, 8), []);
  const capGeom = useMemo(() => new SphereGeometry(0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), []);
  
  const stemMat = useMemo(() => new MeshStandardMaterial({ color: '#f5f5dc', roughness: 0.7 }), []);
  const capMat = useMemo(() => new MeshStandardMaterial({ roughness: 0.6 }), []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stemGeom.dispose();
      capGeom.dispose();
      stemMat.dispose();
      capMat.dispose();
    };
  }, [stemGeom, capGeom, stemMat, capMat]);
  
  const mushroomData = useMemo(() => {
    return mushrooms.map((plant) => {
      const [x, , z] = toSceneCoords(plant.pos.x, plant.pos.y, worldWidth, worldHeight);
      const scale = plant.size / 12;
      return { x, z, scale, color: new Color(plant.color) };
    });
  }, [mushrooms, worldWidth, worldHeight]);
  
  useEffect(() => {
    if (!stemRef.current || !capRef.current) return;
    
    mushroomData.forEach((m, i) => {
      // Stem height is 0.3, so top of stem is at 0.3 * scale when positioned at center (0.15)
      const stemHeight = 0.3;
      const stemTop = stemHeight * m.scale;
      
      // Stem - center it vertically
      dummy.position.set(m.x, (stemHeight / 2) * m.scale, m.z);
      dummy.scale.set(m.scale, m.scale, m.scale);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      stemRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Cap - position at stem top (half-sphere base sits on top of stem)
      dummy.position.set(m.x, stemTop, m.z);
      dummy.updateMatrix();
      capRef.current!.setMatrixAt(i, dummy.matrix);
      capRef.current!.setColorAt(i, m.color);
    });
    
    stemRef.current.instanceMatrix.needsUpdate = true;
    capRef.current.instanceMatrix.needsUpdate = true;
    if (capRef.current.instanceColor) capRef.current.instanceColor.needsUpdate = true;
  }, [mushroomData, dummy]);
  
  if (mushroomData.length === 0) return null;
  
  return (
    <>
      <instancedMesh ref={stemRef} args={[stemGeom, stemMat, mushroomData.length]} frustumCulled castShadow />
      <instancedMesh ref={capRef} args={[capGeom, capMat, mushroomData.length]} frustumCulled castShadow />
    </>
  );
}
