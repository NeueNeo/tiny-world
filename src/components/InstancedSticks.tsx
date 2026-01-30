import { useRef, useMemo, useEffect } from 'react';
import { 
  InstancedMesh, 
  Object3D, 
  Color, 
  TubeGeometry,
  SphereGeometry,
  CatmullRomCurve3,
  Vector3,
  MeshStandardMaterial,
} from 'three';

interface InstancedSticksProps {
  count?: number;
  seed?: number;
}

// Seeded random for consistent stick placement
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Stick colors - brownish tans, weathered wood tones
const stickColors = [
  '#8B7355',
  '#7A6347',
  '#6B5344',
  '#9C8B6E',
  '#5C4A3D',
  '#A89880',
  '#695140',
];

// Create a stick geometry along a curve
function createStickGeometry(points: Vector3[], radius: number = 0.02) {
  const curve = new CatmullRomCurve3(points);
  return new TubeGeometry(curve, 8, radius, 5, false);
}

export function InstancedSticks({ 
  count = 70, 
  seed = 7777 
}: InstancedSticksProps) {
  const straightRef = useRef<InstancedMesh>(null);
  const bentRef = useRef<InstancedMesh>(null);
  const crookedRef = useRef<InstancedMesh>(null);
  const thinStraightRef = useRef<InstancedMesh>(null);
  const thinBentRef = useRef<InstancedMesh>(null);
  const tinyRef = useRef<InstancedMesh>(null);
  const knotRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  
  // Three stick shape variants
  const straightGeom = useMemo(() => {
    // Straight stick with slight taper
    const points = [
      new Vector3(-0.5, 0, 0),
      new Vector3(-0.15, 0.01, 0),
      new Vector3(0.2, -0.01, 0),
      new Vector3(0.5, 0, 0),
    ];
    return createStickGeometry(points, 0.018);
  }, []);
  
  const bentGeom = useMemo(() => {
    // Gently bent stick
    const points = [
      new Vector3(-0.5, 0, 0),
      new Vector3(-0.15, 0.06, 0.02),
      new Vector3(0.15, 0.08, -0.01),
      new Vector3(0.5, 0.02, 0),
    ];
    return createStickGeometry(points, 0.016);
  }, []);
  
  const crookedGeom = useMemo(() => {
    // More crooked/kinked stick
    const points = [
      new Vector3(-0.5, 0, 0),
      new Vector3(-0.2, 0.04, 0.03),
      new Vector3(0, 0.1, -0.02),
      new Vector3(0.15, 0.03, 0.02),
      new Vector3(0.45, 0.06, 0),
    ];
    return createStickGeometry(points, 0.014);
  }, []);
  
  // Thin twig variants
  const thinStraightGeom = useMemo(() => {
    const points = [
      new Vector3(-0.5, 0, 0),
      new Vector3(-0.1, 0.015, 0),
      new Vector3(0.25, -0.01, 0),
      new Vector3(0.55, 0.005, 0),
    ];
    return createStickGeometry(points, 0.008);
  }, []);
  
  const thinBentGeom = useMemo(() => {
    const points = [
      new Vector3(-0.45, 0, 0),
      new Vector3(-0.1, 0.05, 0.015),
      new Vector3(0.2, 0.07, -0.01),
      new Vector3(0.5, 0.01, 0),
    ];
    return createStickGeometry(points, 0.006);
  }, []);
  
  // Tiny twig - very small and thin
  const tinyGeom = useMemo(() => {
    const points = [
      new Vector3(-0.3, 0, 0),
      new Vector3(-0.05, 0.01, 0),
      new Vector3(0.15, -0.005, 0),
      new Vector3(0.3, 0.005, 0),
    ];
    return createStickGeometry(points, 0.004);
  }, []);
  
  // Knot/node geometry
  const knotGeom = useMemo(() => new SphereGeometry(0.028, 5, 4), []);
  
  const material = useMemo(() => new MeshStandardMaterial({ 
    roughness: 0.92,
    metalness: 0.0,
  }), []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      straightGeom.dispose();
      bentGeom.dispose();
      crookedGeom.dispose();
      thinStraightGeom.dispose();
      thinBentGeom.dispose();
      tinyGeom.dispose();
      knotGeom.dispose();
      material.dispose();
    };
  }, [straightGeom, bentGeom, crookedGeom, thinStraightGeom, thinBentGeom, tinyGeom, knotGeom, material]);
  
  // Distribute sticks among the types
  const stickData = useMemo(() => {
    const straight: { x: number; z: number; rotY: number; scale: number; color: Color }[] = [];
    const bent: { x: number; z: number; rotY: number; scale: number; color: Color }[] = [];
    const crooked: { x: number; z: number; rotY: number; scale: number; color: Color }[] = [];
    const thinStraight: { x: number; z: number; rotY: number; scale: number; color: Color }[] = [];
    const thinBent: { x: number; z: number; rotY: number; scale: number; color: Color }[] = [];
    const tiny: { x: number; z: number; rotY: number; scale: number; color: Color }[] = [];
    const knots: { x: number; z: number; scale: number; color: Color }[] = [];
    
    for (let i = 0; i < count; i++) {
      const s = seed + i * 17 + Math.floor(seededRandom(seed + i) * 100);
      
      // Position
      const x = (seededRandom(s) - 0.5) * 24;
      const z = (seededRandom(s + 1) - 0.5) * 24;
      const rotY = seededRandom(s + 2) * Math.PI * 2;
      const scale = 0.8 + seededRandom(s + 3) * 1.4; // 0.8 - 2.2
      
      // Color
      const colorIdx = Math.floor(seededRandom(s + 4) * stickColors.length);
      const color = new Color(stickColors[colorIdx]);
      color.offsetHSL(0, (seededRandom(s + 5) - 0.5) * 0.08, (seededRandom(s + 6) - 0.5) * 0.1);
      
      // Pick stick type: 22% straight, 22% bent, 14% crooked, 18% thin straight, 12% thin bent, 12% tiny
      const typeRoll = seededRandom(s + 7);
      if (typeRoll < 0.22) {
        straight.push({ x, z, rotY, scale, color });
      } else if (typeRoll < 0.44) {
        bent.push({ x, z, rotY, scale, color });
        // Add knot at bend point sometimes
        if (seededRandom(s + 8) > 0.5) {
          const knotOffsetX = Math.cos(rotY) * 0.1 * scale;
          const knotOffsetZ = Math.sin(rotY) * 0.1 * scale;
          knots.push({ 
            x: x + knotOffsetX, 
            z: z + knotOffsetZ, 
            scale: scale * 0.8,
            color: color.clone() 
          });
        }
      } else if (typeRoll < 0.58) {
        crooked.push({ x, z, rotY, scale, color });
        // Crooked sticks often have knots
        if (seededRandom(s + 9) > 0.3) {
          const knotOffsetX = Math.cos(rotY) * -0.05 * scale;
          const knotOffsetZ = Math.sin(rotY) * -0.05 * scale;
          knots.push({ 
            x: x + knotOffsetX, 
            z: z + knotOffsetZ, 
            scale: scale * 0.7,
            color: color.clone() 
          });
        }
      } else if (typeRoll < 0.76) {
        thinStraight.push({ x, z, rotY, scale: scale * 1.1, color });
      } else if (typeRoll < 0.88) {
        thinBent.push({ x, z, rotY, scale: scale * 1.0, color });
      } else {
        // Tiny twigs - smaller scale
        tiny.push({ x, z, rotY, scale: scale * 0.6, color });
      }
    }
    
    return { straight, bent, crooked, thinStraight, thinBent, tiny, knots };
  }, [count, seed]);
  
  // Set transforms
  useEffect(() => {
    // Straight sticks
    if (straightRef.current) {
      stickData.straight.forEach((stick, i) => {
        dummy.position.set(stick.x, 0.015, stick.z);
        dummy.rotation.set(0, stick.rotY, 0);
        dummy.scale.setScalar(stick.scale);
        dummy.updateMatrix();
        straightRef.current!.setMatrixAt(i, dummy.matrix);
        straightRef.current!.setColorAt(i, stick.color);
      });
      straightRef.current.instanceMatrix.needsUpdate = true;
      if (straightRef.current.instanceColor) straightRef.current.instanceColor.needsUpdate = true;
    }
    
    // Bent sticks
    if (bentRef.current) {
      stickData.bent.forEach((stick, i) => {
        dummy.position.set(stick.x, 0.015, stick.z);
        dummy.rotation.set(0, stick.rotY, 0);
        dummy.scale.setScalar(stick.scale);
        dummy.updateMatrix();
        bentRef.current!.setMatrixAt(i, dummy.matrix);
        bentRef.current!.setColorAt(i, stick.color);
      });
      bentRef.current.instanceMatrix.needsUpdate = true;
      if (bentRef.current.instanceColor) bentRef.current.instanceColor.needsUpdate = true;
    }
    
    // Crooked sticks
    if (crookedRef.current) {
      stickData.crooked.forEach((stick, i) => {
        dummy.position.set(stick.x, 0.015, stick.z);
        dummy.rotation.set(0, stick.rotY, 0);
        dummy.scale.setScalar(stick.scale);
        dummy.updateMatrix();
        crookedRef.current!.setMatrixAt(i, dummy.matrix);
        crookedRef.current!.setColorAt(i, stick.color);
      });
      crookedRef.current.instanceMatrix.needsUpdate = true;
      if (crookedRef.current.instanceColor) crookedRef.current.instanceColor.needsUpdate = true;
    }
    
    // Thin straight
    if (thinStraightRef.current) {
      stickData.thinStraight.forEach((stick, i) => {
        dummy.position.set(stick.x, 0.01, stick.z);
        dummy.rotation.set(0, stick.rotY, 0);
        dummy.scale.setScalar(stick.scale);
        dummy.updateMatrix();
        thinStraightRef.current!.setMatrixAt(i, dummy.matrix);
        thinStraightRef.current!.setColorAt(i, stick.color);
      });
      thinStraightRef.current.instanceMatrix.needsUpdate = true;
      if (thinStraightRef.current.instanceColor) thinStraightRef.current.instanceColor.needsUpdate = true;
    }
    
    // Thin bent
    if (thinBentRef.current) {
      stickData.thinBent.forEach((stick, i) => {
        dummy.position.set(stick.x, 0.01, stick.z);
        dummy.rotation.set(0, stick.rotY, 0);
        dummy.scale.setScalar(stick.scale);
        dummy.updateMatrix();
        thinBentRef.current!.setMatrixAt(i, dummy.matrix);
        thinBentRef.current!.setColorAt(i, stick.color);
      });
      thinBentRef.current.instanceMatrix.needsUpdate = true;
      if (thinBentRef.current.instanceColor) thinBentRef.current.instanceColor.needsUpdate = true;
    }
    
    // Tiny twigs
    if (tinyRef.current) {
      stickData.tiny.forEach((stick, i) => {
        dummy.position.set(stick.x, 0.008, stick.z);
        dummy.rotation.set(0, stick.rotY, 0);
        dummy.scale.setScalar(stick.scale);
        dummy.updateMatrix();
        tinyRef.current!.setMatrixAt(i, dummy.matrix);
        tinyRef.current!.setColorAt(i, stick.color);
      });
      tinyRef.current.instanceMatrix.needsUpdate = true;
      if (tinyRef.current.instanceColor) tinyRef.current.instanceColor.needsUpdate = true;
    }
    
    // Knots
    if (knotRef.current && stickData.knots.length > 0) {
      stickData.knots.forEach((knot, i) => {
        dummy.position.set(knot.x, 0.02, knot.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(knot.scale);
        dummy.updateMatrix();
        knotRef.current!.setMatrixAt(i, dummy.matrix);
        knotRef.current!.setColorAt(i, knot.color);
      });
      knotRef.current.instanceMatrix.needsUpdate = true;
      if (knotRef.current.instanceColor) knotRef.current.instanceColor.needsUpdate = true;
    }
  }, [stickData, dummy]);
  
  if (count === 0) return null;
  
  return (
    <>
      {stickData.straight.length > 0 && (
        <instancedMesh ref={straightRef} args={[straightGeom, material, stickData.straight.length]} frustumCulled receiveShadow castShadow />
      )}
      {stickData.bent.length > 0 && (
        <instancedMesh ref={bentRef} args={[bentGeom, material, stickData.bent.length]} frustumCulled receiveShadow castShadow />
      )}
      {stickData.crooked.length > 0 && (
        <instancedMesh ref={crookedRef} args={[crookedGeom, material, stickData.crooked.length]} frustumCulled receiveShadow castShadow />
      )}
      {stickData.thinStraight.length > 0 && (
        <instancedMesh ref={thinStraightRef} args={[thinStraightGeom, material, stickData.thinStraight.length]} frustumCulled receiveShadow castShadow />
      )}
      {stickData.thinBent.length > 0 && (
        <instancedMesh ref={thinBentRef} args={[thinBentGeom, material, stickData.thinBent.length]} frustumCulled receiveShadow castShadow />
      )}
      {stickData.tiny.length > 0 && (
        <instancedMesh ref={tinyRef} args={[tinyGeom, material, stickData.tiny.length]} frustumCulled receiveShadow castShadow />
      )}
      {stickData.knots.length > 0 && (
        <instancedMesh ref={knotRef} args={[knotGeom, material, stickData.knots.length]} frustumCulled receiveShadow />
      )}
    </>
  );
}
