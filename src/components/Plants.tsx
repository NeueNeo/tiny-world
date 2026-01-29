import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Color } from 'three';
import type { Plant } from '../world/types';

interface PlantProps {
  plant: Plant;
  worldWidth: number;
  worldHeight: number;
}

// Convert 2D world coords to 3D scene coords
function toSceneCoords(x: number, y: number, worldWidth: number, worldHeight: number): [number, number, number] {
  const sceneX = (x / worldWidth - 0.5) * 21;
  const sceneZ = (y / worldHeight - 0.5) * 21;
  return [sceneX, 0, sceneZ];
}

export function Flower({ plant, worldWidth, worldHeight }: PlantProps) {
  const groupRef = useRef<Group>(null);
  const [x, , z] = toSceneCoords(plant.pos.x, plant.pos.y, worldWidth, worldHeight);
  const scale = plant.size / 3.5; // Flowers
  
  const petalColor = useMemo(() => new Color(plant.color), [plant.color]);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle sway
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + x * 10) * 0.05;
    }
  });
  
  return (
    <group ref={groupRef} position={[x, 0, z]} scale={scale}>
      {/* Stem */}
      <mesh position={[0, 0.4, 0]} >
        <cylinderGeometry args={[0.02, 0.03, 0.8, 8]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.8} />
      </mesh>
      
      {/* Petals */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        const px = Math.cos(angle) * 0.15;
        const pz = Math.sin(angle) * 0.15;
        return (
          <mesh 
            key={i} 
            position={[px, 0.85, pz]} 
            rotation={[0.3, angle, 0]}
            
          >
            <sphereGeometry args={[0.12, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={petalColor} roughness={0.6} />
          </mesh>
        );
      })}
      
      {/* Center */}
      <mesh position={[0, 0.85, 0]} >
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ffd93d" roughness={0.5} />
      </mesh>
    </group>
  );
}

export function Grass({ plant, worldWidth, worldHeight }: PlantProps) {
  const groupRef = useRef<Group>(null);
  const [x, , z] = toSceneCoords(plant.pos.x, plant.pos.y, worldWidth, worldHeight);
  const scale = plant.size / 1.5; // Taller grass
  
  // Vary grass color slightly for natural look
  const bladeColor = useMemo(() => {
    const base = new Color(plant.color);
    const hsl = { h: 0, s: 0, l: 0 };
    base.getHSL(hsl);
    // Slight variation in lightness
    hsl.l = Math.max(0.15, Math.min(0.6, hsl.l + (Math.random() - 0.5) * 0.1));
    return new Color().setHSL(hsl.h, hsl.s, hsl.l);
  }, [plant.color]);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Wind sway - use position for variation
      const wind = Math.sin(state.clock.elapsedTime * 1.2 + x * 3 + z * 2) * 0.15;
      groupRef.current.rotation.z = wind;
      groupRef.current.rotation.x = wind * 0.3;
    }
  });
  
  // Dense clump of grass blades
  const blades = useMemo(() => {
    const result = [];
    const count = 6 + Math.floor(Math.random() * 5); // 6-10 blades per clump
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = Math.random() * 0.08;
      result.push({
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        height: 0.15 + Math.random() * 0.35,
        lean: (Math.random() - 0.5) * 0.4,
        rotY: Math.random() * Math.PI,
      });
    }
    return result;
  }, []);
  
  return (
    <group ref={groupRef} position={[x, 0, z]} scale={scale}>
      {blades.map((blade, i) => (
        <mesh 
          key={i} 
          position={[blade.x, blade.height / 2, blade.z]}
          rotation={[0, blade.rotY, blade.lean]}
        >
          <boxGeometry args={[0.005, blade.height, 0.002]} />
          <meshStandardMaterial color={bladeColor} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

export function Mushroom({ plant, worldWidth, worldHeight }: PlantProps) {
  const groupRef = useRef<Group>(null);
  const [x, , z] = toSceneCoords(plant.pos.x, plant.pos.y, worldWidth, worldHeight);
  const scale = plant.size / 12;
  
  const capColor = useMemo(() => new Color(plant.color), [plant.color]);
  
  return (
    <group ref={groupRef} position={[x, 0, z]} scale={scale}>
      {/* Stem */}
      <mesh position={[0, 0.15, 0]} >
        <cylinderGeometry args={[0.06, 0.08, 0.3, 12]} />
        <meshStandardMaterial color="#f5f5dc" roughness={0.7} />
      </mesh>
      
      {/* Cap */}
      <mesh position={[0, 0.35, 0]} >
        <sphereGeometry args={[0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={capColor} roughness={0.6} />
      </mesh>
      
      {/* Spots */}
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2 + 0.5;
        const spotX = Math.cos(angle) * 0.1;
        const spotZ = Math.sin(angle) * 0.1;
        return (
          <mesh key={i} position={[spotX, 0.38, spotZ]} >
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

export function Blade({ plant, worldWidth, worldHeight }: PlantProps) {
  const meshRef = useRef<any>(null);
  const [x, , z] = toSceneCoords(plant.pos.x, plant.pos.y, worldWidth, worldHeight);
  const scale = plant.size / 1.2; // Taller blades
  
  const bladeColor = useMemo(() => new Color(plant.color), [plant.color]);
  const height = useMemo(() => 0.2 + Math.random() * 0.4, []);
  const lean = useMemo(() => (Math.random() - 0.5) * 0.5, []);
  
  useFrame((state) => {
    if (meshRef.current) {
      const wind = Math.sin(state.clock.elapsedTime * 1.5 + x * 4 + z * 3) * 0.2;
      meshRef.current.rotation.z = lean + wind;
      meshRef.current.rotation.x = wind * 0.4;
    }
  });
  
  return (
    <mesh 
      ref={meshRef}
      position={[x, height * scale / 2, z]} 
      scale={scale}
    >
      <boxGeometry args={[0.004, height, 0.002]} />
      <meshStandardMaterial color={bladeColor} roughness={0.9} />
    </mesh>
  );
}

export function Daisy({ plant, worldWidth, worldHeight }: PlantProps) {
  const groupRef = useRef<Group>(null);
  const [x, , z] = toSceneCoords(plant.pos.x, plant.pos.y, worldWidth, worldHeight);
  const scale = plant.size / 3.5; // Daisies
  
  const petalColor = useMemo(() => new Color(plant.color), [plant.color]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4 + x * 8) * 0.04;
    }
  });
  
  return (
    <group ref={groupRef} position={[x, 0, z]} scale={scale}>
      {/* Stem */}
      <mesh position={[0, 0.3, 0]} >
        <cylinderGeometry args={[0.015, 0.02, 0.6, 8]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.8} />
      </mesh>
      
      {/* Many thin petals */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const px = Math.cos(angle) * 0.12;
        const pz = Math.sin(angle) * 0.12;
        return (
          <mesh key={i} position={[px, 0.65, pz]} rotation={[0.4, angle, 0]} >
            <boxGeometry args={[0.03, 0.12, 0.01]} />
            <meshStandardMaterial color={petalColor} roughness={0.5} />
          </mesh>
        );
      })}
      
      {/* Yellow center */}
      <mesh position={[0, 0.65, 0]} >
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#ffd700" roughness={0.4} />
      </mesh>
    </group>
  );
}

export function Tulip({ plant, worldWidth, worldHeight }: PlantProps) {
  const groupRef = useRef<Group>(null);
  const [x, , z] = toSceneCoords(plant.pos.x, plant.pos.y, worldWidth, worldHeight);
  const scale = plant.size / 4.5; // Tulips
  
  const petalColor = useMemo(() => new Color(plant.color), [plant.color]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3 + x * 6) * 0.03;
    }
  });
  
  return (
    <group ref={groupRef} position={[x, 0, z]} scale={scale}>
      {/* Stem */}
      <mesh position={[0, 0.4, 0]} >
        <cylinderGeometry args={[0.02, 0.025, 0.8, 8]} />
        <meshStandardMaterial color="#1e5a1e" roughness={0.8} />
      </mesh>
      
      {/* Leaf */}
      <mesh position={[0.08, 0.25, 0]} rotation={[0, 0, 0.3]} >
        <boxGeometry args={[0.15, 0.35, 0.02]} />
        <meshStandardMaterial color="#228b22" roughness={0.7} />
      </mesh>
      
      {/* Cup-shaped petals */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const px = Math.cos(angle) * 0.06;
        const pz = Math.sin(angle) * 0.06;
        return (
          <mesh key={i} position={[px, 0.85, pz]} rotation={[-0.2, angle, 0]} >
            <sphereGeometry args={[0.08, 8, 8, 0, Math.PI, 0, Math.PI / 1.5]} />
            <meshStandardMaterial color={petalColor} roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

export function Wildflower({ plant, worldWidth, worldHeight }: PlantProps) {
  const groupRef = useRef<Group>(null);
  const [x, , z] = toSceneCoords(plant.pos.x, plant.pos.y, worldWidth, worldHeight);
  const scale = plant.size / 3; // Wildflowers
  
  const petalColor = useMemo(() => new Color(plant.color), [plant.color]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6 + x * 10) * 0.08;
    }
  });
  
  // Multiple small flowers on branching stems
  const flowers = useMemo(() => {
    return Array.from({ length: 3 + Math.floor(Math.random() * 3) }).map((_, i) => ({
      x: (Math.random() - 0.5) * 0.15,
      y: 0.3 + Math.random() * 0.25,
      z: (Math.random() - 0.5) * 0.15,
    }));
  }, []);
  
  return (
    <group ref={groupRef} position={[x, 0, z]} scale={scale}>
      {/* Main stem */}
      <mesh position={[0, 0.2, 0]} >
        <cylinderGeometry args={[0.01, 0.015, 0.4, 6]} />
        <meshStandardMaterial color="#3d6b3d" roughness={0.8} />
      </mesh>
      
      {/* Small flowers */}
      {flowers.map((f, i) => (
        <group key={i} position={[f.x, f.y, f.z]}>
          {/* Tiny petals */}
          {Array.from({ length: 5 }).map((_, j) => {
            const angle = (j / 5) * Math.PI * 2;
            return (
              <mesh key={j} position={[Math.cos(angle) * 0.03, 0, Math.sin(angle) * 0.03]} >
                <sphereGeometry args={[0.025, 6, 6]} />
                <meshStandardMaterial color={petalColor} roughness={0.6} />
              </mesh>
            );
          })}
          <mesh >
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#ffeb3b" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function PlantModel({ plant, worldWidth, worldHeight }: PlantProps) {
  switch (plant.type) {
    case 'flower':
      return <Flower plant={plant} worldWidth={worldWidth} worldHeight={worldHeight} />;
    case 'grass':
      return <Grass plant={plant} worldWidth={worldWidth} worldHeight={worldHeight} />;
    case 'mushroom':
      return <Mushroom plant={plant} worldWidth={worldWidth} worldHeight={worldHeight} />;
    case 'blade':
      return <Blade plant={plant} worldWidth={worldWidth} worldHeight={worldHeight} />;
    case 'daisy':
      return <Daisy plant={plant} worldWidth={worldWidth} worldHeight={worldHeight} />;
    case 'tulip':
      return <Tulip plant={plant} worldWidth={worldWidth} worldHeight={worldHeight} />;
    case 'wildflower':
      return <Wildflower plant={plant} worldWidth={worldWidth} worldHeight={worldHeight} />;
    default:
      return null;
  }
}
