import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { 
  InstancedMesh, 
  Object3D, 
  Color, 
  SphereGeometry,
  MeshBasicMaterial,
  AdditiveBlending,
} from 'three';

interface FireflyData {
  x: number;
  y: number;
  z: number;
  baseY: number;
  phase: number;       // Movement phase offset
  flashPhase: number;  // Flash timing offset
  flashDuration: number;
  flashInterval: number;
  speed: number;
  wanderAngle: number;
}

interface InstancedFirefliesProps {
  count?: number;
  dayPhase: number;
}

// Seeded random for consistent firefly placement
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function InstancedFireflies({ 
  count = 25, 
  dayPhase 
}: InstancedFirefliesProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const glowRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  
  // Core geometry - tiny sphere
  const coreGeom = useMemo(() => new SphereGeometry(0.02, 6, 6), []);
  // Glow geometry - larger, softer
  const glowGeom = useMemo(() => new SphereGeometry(0.08, 8, 8), []);
  
  // Emissive material - color > 1 triggers bloom
  const coreMat = useMemo(() => new MeshBasicMaterial({ 
    color: new Color(4, 3, 0.5), // HDR yellow-green for bloom
    toneMapped: false,
  }), []);
  
  const glowMat = useMemo(() => new MeshBasicMaterial({ 
    color: new Color(2, 1.5, 0.2),
    transparent: true,
    opacity: 0.4,
    blending: AdditiveBlending,
    toneMapped: false,
  }), []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      coreGeom.dispose();
      glowGeom.dispose();
      coreMat.dispose();
      glowMat.dispose();
    };
  }, [coreGeom, glowGeom, coreMat, glowMat]);
  
  // Initialize firefly data
  const fireflies = useMemo<FireflyData[]>(() => {
    const data: FireflyData[] = [];
    const seed = 9999;
    
    for (let i = 0; i < count; i++) {
      const s = seed + i * 31;
      data.push({
        x: (seededRandom(s) - 0.5) * 22,
        y: 0.3 + seededRandom(s + 1) * 1.5,  // Hover above ground
        z: (seededRandom(s + 2) - 0.5) * 22,
        baseY: 0.3 + seededRandom(s + 1) * 1.5,
        phase: seededRandom(s + 3) * Math.PI * 2,
        flashPhase: seededRandom(s + 4) * 10,  // Offset flash timing
        flashDuration: 0.3 + seededRandom(s + 5) * 0.4,  // 0.3-0.7s flash
        flashInterval: 5 + seededRandom(s + 6) * 4,      // 5-9s between flashes
        speed: 0.1 + seededRandom(s + 7) * 0.15,
        wanderAngle: seededRandom(s + 8) * Math.PI * 2,
      });
    }
    return data;
  }, [count]);
  
  // Visibility based on time of day (dusk/night only)
  const isVisible = dayPhase < 0.25 || dayPhase > 0.75;
  // Fade in/out at transitions
  const visibility = useMemo(() => {
    if (dayPhase < 0.2) return 1;
    if (dayPhase < 0.25) return 1 - (dayPhase - 0.2) / 0.05;
    if (dayPhase > 0.8) return 1;
    if (dayPhase > 0.75) return (dayPhase - 0.75) / 0.05;
    return 0;
  }, [dayPhase]);
  
  useFrame((state) => {
    if (!meshRef.current || !glowRef.current || !isVisible) return;
    
    const time = state.clock.elapsedTime;
    
    fireflies.forEach((ff, i) => {
      // Lazy floating movement
      const wobbleX = Math.sin(time * 0.3 + ff.phase) * 0.02;
      const wobbleZ = Math.cos(time * 0.4 + ff.phase * 1.3) * 0.02;
      
      // Slow wandering
      ff.wanderAngle += (Math.sin(time * 0.1 + ff.phase) * 0.01);
      ff.x += Math.cos(ff.wanderAngle) * ff.speed * 0.016;
      ff.z += Math.sin(ff.wanderAngle) * ff.speed * 0.016;
      
      // Gentle vertical bob with occasional rises (J pattern)
      const riseChance = Math.sin(time * 0.2 + ff.phase * 2);
      const rise = riseChance > 0.8 ? (riseChance - 0.8) * 2 : 0;
      ff.y = ff.baseY + Math.sin(time * 0.5 + ff.phase) * 0.15 + rise * 0.5;
      
      // Boundary wrap
      if (ff.x < -11) ff.x = 11;
      if (ff.x > 11) ff.x = -11;
      if (ff.z < -11) ff.z = 11;
      if (ff.z > 11) ff.z = -11;
      
      // Flash calculation
      const flashCycle = (time + ff.flashPhase) % ff.flashInterval;
      const isFlashing = flashCycle < ff.flashDuration;
      
      // Smooth flash envelope (fade in/out)
      let flashIntensity = 0;
      if (isFlashing) {
        const flashProgress = flashCycle / ff.flashDuration;
        // Sine envelope for smooth glow
        flashIntensity = Math.sin(flashProgress * Math.PI);
      }
      
      const finalIntensity = flashIntensity * visibility;
      const scale = finalIntensity > 0.01 ? 1 : 0.001; // Hide when not flashing
      
      // Core
      dummy.position.set(ff.x + wobbleX, ff.y, ff.z + wobbleZ);
      dummy.scale.setScalar(scale * finalIntensity);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Glow (larger, follows core)
      dummy.scale.setScalar(scale * finalIntensity * 1.5);
      dummy.updateMatrix();
      glowRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    glowRef.current.instanceMatrix.needsUpdate = true;
  });
  
  if (!isVisible) return null;
  
  return (
    <>
      <instancedMesh 
        ref={meshRef} 
        args={[coreGeom, coreMat, count]} 
        frustumCulled={false}
      />
      <instancedMesh 
        ref={glowRef} 
        args={[glowGeom, glowMat, count]} 
        frustumCulled={false}
      />
    </>
  );
}
