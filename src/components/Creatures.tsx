import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Color } from 'three';
import type { Creature } from '../world/types';

interface CreatureProps {
  creature: Creature;
  worldWidth: number;
  worldHeight: number;
}

function toSceneCoords(x: number, y: number, worldWidth: number, worldHeight: number): [number, number, number] {
  const sceneX = (x / worldWidth - 0.5) * 21;
  const sceneZ = (y / worldHeight - 0.5) * 21;
  return [sceneX, 0, sceneZ];
}

export function Bug({ creature, worldWidth, worldHeight }: CreatureProps) {
  const groupRef = useRef<Group>(null);
  const [x, , z] = toSceneCoords(creature.pos.x, creature.pos.y, worldWidth, worldHeight);
  const scale = creature.size / 2.5; // Bigger for visibility
  
  const bodyColor = useMemo(() => new Color(creature.color), [creature.color]);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Update position from world coords
      const [nx, , nz] = toSceneCoords(creature.pos.x, creature.pos.y, worldWidth, worldHeight);
      groupRef.current.position.x = nx;
      groupRef.current.position.z = nz;
      
      // Face movement direction
      if (Math.abs(creature.vel.x) > 0.01 || Math.abs(creature.vel.y) > 0.01) {
        groupRef.current.rotation.y = Math.atan2(creature.vel.x, creature.vel.y);
      }
      
      // Bob animation
      groupRef.current.position.y = 0.05 + Math.sin(state.clock.elapsedTime * 8) * 0.01;
    }
  });
  
  return (
    <group ref={groupRef} position={[x, 0.05, z]} scale={scale}>
      {/* Body */}
      <mesh castShadow>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0, 0.08]} castShadow>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      
      {/* Legs */}
      {[-1, 0, 1].map((i) => (
        <group key={i}>
          <mesh position={[0.06, -0.02, i * 0.03]} rotation={[0, 0, 0.5]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.06, 6]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-0.06, -0.02, i * 0.03]} rotation={[0, 0, -0.5]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.06, 6]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Snail({ creature, worldWidth, worldHeight }: CreatureProps) {
  const groupRef = useRef<Group>(null);
  const [x, , z] = toSceneCoords(creature.pos.x, creature.pos.y, worldWidth, worldHeight);
  const scale = creature.size / 6; // Reduced 50%
  
  const shellColor = useMemo(() => new Color(creature.color), [creature.color]);
  
  useFrame(() => {
    if (groupRef.current) {
      const [nx, , nz] = toSceneCoords(creature.pos.x, creature.pos.y, worldWidth, worldHeight);
      groupRef.current.position.x = nx;
      groupRef.current.position.z = nz;
      
      if (Math.abs(creature.vel.x) > 0.01 || Math.abs(creature.vel.y) > 0.01) {
        groupRef.current.rotation.y = Math.atan2(creature.vel.x, creature.vel.y);
      }
    }
  });
  
  return (
    <group ref={groupRef} position={[x, 0.04, z]} scale={scale}>
      {/* Shell */}
      <mesh position={[-0.05, 0.08, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={shellColor} roughness={0.5} />
      </mesh>
      
      {/* Body */}
      <mesh position={[0.05, 0, 0]} castShadow>
        <capsuleGeometry args={[0.03, 0.12, 8, 16]} />
        <meshStandardMaterial color="#9a8b7a" roughness={0.8} />
      </mesh>
      
      {/* Eye stalks */}
      <mesh position={[0.1, 0.06, 0.02]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.08, 6]} />
        <meshStandardMaterial color="#9a8b7a" />
      </mesh>
      <mesh position={[0.1, 0.06, -0.02]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.08, 6]} />
        <meshStandardMaterial color="#9a8b7a" />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.1, 0.1, 0.02]} castShadow>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.1, 0.1, -0.02]} castShadow>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

export function Butterfly({ creature, worldWidth, worldHeight }: CreatureProps) {
  const groupRef = useRef<Group>(null);
  const leftWingsRef = useRef<Group>(null);
  const rightWingsRef = useRef<Group>(null);
  const [x, , z] = toSceneCoords(creature.pos.x, creature.pos.y, worldWidth, worldHeight);
  const scale = creature.size / 3;
  
  const wingColor = useMemo(() => new Color(creature.color), [creature.color]);
  // Slightly darker color for wing markings
  const markingColor = useMemo(() => {
    const c = new Color(creature.color);
    c.multiplyScalar(0.6);
    return c;
  }, [creature.color]);
  
  useFrame((state) => {
    if (groupRef.current) {
      const [nx, , nz] = toSceneCoords(creature.pos.x, creature.pos.y, worldWidth, worldHeight);
      groupRef.current.position.x = nx;
      groupRef.current.position.z = nz;
      
      // Float high above the flowers with gentle bobbing
      const baseHeight = 3 + Math.sin(creature.pos.x * 0.5) * 0.5;
      groupRef.current.position.y = baseHeight + Math.sin(state.clock.elapsedTime * 1.5 + creature.pos.x) * 0.3;
      
      // Gentle body tilt while flying
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.8 + creature.pos.y) * 0.1;
      
      if (Math.abs(creature.vel.x) > 0.01 || Math.abs(creature.vel.y) > 0.01) {
        groupRef.current.rotation.y = Math.atan2(creature.vel.x, creature.vel.y);
      }
    }
    
    // Wing flapping - butterfly wings flap together, up and down
    if (leftWingsRef.current && rightWingsRef.current) {
      const flap = Math.sin(state.clock.elapsedTime * 12) * 1.2; // Wide flap range
      leftWingsRef.current.rotation.z = 0.1 + flap;
      rightWingsRef.current.rotation.z = -0.1 - flap;
    }
  });
  
  // Wing shape component - flat triangular wing
  const Wing = ({ isForewing, mirror }: { isForewing: boolean; mirror: boolean }) => {
    const width = isForewing ? 0.18 : 0.12;
    const height = isForewing ? 0.22 : 0.14;
    const xOffset = mirror ? -0.01 : 0.01;
    const yOffset = isForewing ? 0.02 : -0.04;
    
    return (
      <group position={[xOffset, yOffset, 0]}>
        {/* Main wing surface */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial 
            color={wingColor} 
            side={2} // DoubleSide
            transparent
            opacity={0.9}
            roughness={0.3}
          />
        </mesh>
        {/* Wing edge/marking */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.001]}>
          <ringGeometry args={[width * 0.3, width * 0.45, 16, 1, 0, Math.PI]} />
          <meshStandardMaterial 
            color={markingColor}
            side={2}
            transparent
            opacity={0.8}
          />
        </mesh>
        {/* Spot marking */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height * 0.15, 0.002]}>
          <circleGeometry args={[width * 0.15, 12]} />
          <meshStandardMaterial 
            color="#1a1a1a"
            side={2}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>
    );
  };
  
  return (
    <group ref={groupRef} position={[x, 1.5, z]} scale={scale}>
      {/* Body - three segments */}
      {/* Head */}
      <mesh position={[0, 0, 0.06]} castShadow>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>
      
      {/* Antennae */}
      <mesh position={[0.015, 0.01, 0.08]} rotation={[0.5, 0, 0.3]}>
        <cylinderGeometry args={[0.003, 0.002, 0.08, 4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.015, 0.01, 0.08]} rotation={[0.5, 0, -0.3]}>
        <cylinderGeometry args={[0.003, 0.002, 0.08, 4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Antenna tips */}
      <mesh position={[0.035, 0.05, 0.11]}>
        <sphereGeometry args={[0.008, 6, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.035, 0.05, 0.11]}>
        <sphereGeometry args={[0.008, 6, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Thorax */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
      </mesh>
      
      {/* Abdomen - elongated */}
      <mesh position={[0, 0, -0.08]} castShadow>
        <capsuleGeometry args={[0.02, 0.1, 6, 12]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
      </mesh>
      
      {/* Left wings */}
      <group ref={leftWingsRef} position={[0.03, 0, 0]}>
        <Wing isForewing={true} mirror={false} />
        <Wing isForewing={false} mirror={false} />
      </group>
      
      {/* Right wings */}
      <group ref={rightWingsRef} position={[-0.03, 0, 0]} scale={[-1, 1, 1]}>
        <Wing isForewing={true} mirror={true} />
        <Wing isForewing={false} mirror={true} />
      </group>
    </group>
  );
}

export function Caterpillar({ creature, worldWidth, worldHeight }: CreatureProps) {
  const groupRef = useRef<Group>(null);
  const segmentsRef = useRef<Group>(null);
  const [x, , z] = toSceneCoords(creature.pos.x, creature.pos.y, worldWidth, worldHeight);
  const scale = creature.size / 3;
  
  const bodyColor = useMemo(() => new Color(creature.color), [creature.color]);
  const darkerColor = useMemo(() => {
    const c = new Color(creature.color);
    c.multiplyScalar(0.6);
    return c;
  }, [creature.color]);
  
  useFrame((state) => {
    if (groupRef.current) {
      const [nx, , nz] = toSceneCoords(creature.pos.x, creature.pos.y, worldWidth, worldHeight);
      groupRef.current.position.x = nx;
      groupRef.current.position.z = nz;
      
      // Face movement direction
      if (Math.abs(creature.vel.x) > 0.005 || Math.abs(creature.vel.y) > 0.005) {
        groupRef.current.rotation.y = Math.atan2(creature.vel.x, creature.vel.y);
      }
    }
    
    // Undulating inchworm movement
    if (segmentsRef.current) {
      segmentsRef.current.children.forEach((child, i) => {
        const wave = Math.sin(state.clock.elapsedTime * 3 - i * 0.8) * 0.015;
        child.position.y = 0.02 + wave;
      });
    }
  });
  
  // 6 distinct segments, spread apart, skinny
  const segmentRadius = 0.025; // Skinny
  const segmentSpacing = 0.055; // Spread apart so they're visible
  
  return (
    <group ref={groupRef} position={[x, 0.02, z]} scale={scale}>
      <group ref={segmentsRef}>
        {/* 6 body segments - clearly separated */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const segmentZ = -i * segmentSpacing;
          const isStripe = i % 2 === 0;
          // Taper: head bigger, tail smaller
          const radius = i === 0 ? segmentRadius * 1.2 : segmentRadius * (1 - i * 0.08);
          
          return (
            <mesh key={i} position={[0, 0.02, segmentZ]} castShadow>
              <sphereGeometry args={[radius, 8, 6]} />
              <meshStandardMaterial 
                color={isStripe ? bodyColor : darkerColor} 
                roughness={0.7} 
              />
            </mesh>
          );
        })}
      </group>
      
      {/* Eyes on head */}
      <mesh position={[0.018, 0.035, 0.02]}>
        <sphereGeometry args={[0.008, 6, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.018, 0.035, 0.02]}>
        <sphereGeometry args={[0.008, 6, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Antennae */}
      <mesh position={[0.012, 0.045, 0.03]} rotation={[0.6, 0, 0.3]}>
        <cylinderGeometry args={[0.003, 0.002, 0.04, 4]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[-0.012, 0.045, 0.03]} rotation={[0.6, 0, -0.3]}>
        <cylinderGeometry args={[0.003, 0.002, 0.04, 4]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      
      {/* Tiny legs - 3 pairs */}
      {[0, 1, 2].map((i) => {
        const legZ = -i * segmentSpacing * 1.5 - 0.02;
        return (
          <group key={i}>
            <mesh position={[0.02, 0.005, legZ]} rotation={[0, 0, 0.5]}>
              <cylinderGeometry args={[0.003, 0.003, 0.02, 4]} />
              <meshStandardMaterial color={darkerColor} />
            </mesh>
            <mesh position={[-0.02, 0.005, legZ]} rotation={[0, 0, -0.5]}>
              <cylinderGeometry args={[0.003, 0.003, 0.02, 4]} />
              <meshStandardMaterial color={darkerColor} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function Ant({ creature, worldWidth, worldHeight }: CreatureProps) {
  const groupRef = useRef<Group>(null);
  const [x, , z] = toSceneCoords(creature.pos.x, creature.pos.y, worldWidth, worldHeight);
  const scale = creature.size / 4; // Very small - smaller than bugs
  
  const bodyColor = useMemo(() => new Color(creature.color), [creature.color]);
  
  useFrame((state) => {
    if (groupRef.current) {
      const [nx, , nz] = toSceneCoords(creature.pos.x, creature.pos.y, worldWidth, worldHeight);
      groupRef.current.position.x = nx;
      groupRef.current.position.z = nz;
      
      // Face movement direction
      if (Math.abs(creature.vel.x) > 0.01 || Math.abs(creature.vel.y) > 0.01) {
        groupRef.current.rotation.y = Math.atan2(creature.vel.x, creature.vel.y);
      }
      
      // Quick scurrying motion - slight bobbing
      groupRef.current.position.y = 0.01 + Math.sin(state.clock.elapsedTime * 20 + creature.pos.x) * 0.003;
    }
  });
  
  return (
    <group ref={groupRef} position={[x, 0.01, z]} scale={scale}>
      {/* Head - small sphere */}
      <mesh position={[0, 0.015, 0.045]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>
      
      {/* Mandibles */}
      <mesh position={[0.008, 0.01, 0.06]} rotation={[0.3, 0.3, 0]}>
        <boxGeometry args={[0.004, 0.003, 0.012]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[-0.008, 0.01, 0.06]} rotation={[0.3, -0.3, 0]}>
        <boxGeometry args={[0.004, 0.003, 0.012]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      
      {/* Elbowed antennae - two segments each */}
      {/* Right antenna - base segment */}
      <mesh position={[0.012, 0.025, 0.05]} rotation={[0.8, 0.4, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.025, 4]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      {/* Right antenna - tip segment (elbowed) */}
      <mesh position={[0.022, 0.04, 0.06]} rotation={[0.2, 0, 0.5]}>
        <cylinderGeometry args={[0.0015, 0.0015, 0.02, 4]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      {/* Left antenna - base segment */}
      <mesh position={[-0.012, 0.025, 0.05]} rotation={[0.8, -0.4, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.025, 4]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      {/* Left antenna - tip segment (elbowed) */}
      <mesh position={[-0.022, 0.04, 0.06]} rotation={[0.2, 0, -0.5]}>
        <cylinderGeometry args={[0.0015, 0.0015, 0.02, 4]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      
      {/* Thorax - middle segment, slightly elongated */}
      <mesh position={[0, 0.018, 0.015]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>
      
      {/* Petiole - narrow waist connecting thorax to abdomen */}
      <mesh position={[0, 0.015, -0.01]}>
        <sphereGeometry args={[0.008, 6, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>
      
      {/* Abdomen/Gaster - larger oval at back */}
      <mesh position={[0, 0.02, -0.045]}>
        <sphereGeometry args={[0.03, 10, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>
      
      {/* 6 legs - 3 pairs attached to thorax */}
      {/* Front legs */}
      <mesh position={[0.018, 0, 0.025]} rotation={[0.2, 0.3, 0.8]}>
        <cylinderGeometry args={[0.002, 0.0015, 0.035, 4]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[-0.018, 0, 0.025]} rotation={[0.2, -0.3, -0.8]}>
        <cylinderGeometry args={[0.002, 0.0015, 0.035, 4]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      {/* Middle legs */}
      <mesh position={[0.022, 0, 0.012]} rotation={[0, 0, 0.9]}>
        <cylinderGeometry args={[0.002, 0.0015, 0.04, 4]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[-0.022, 0, 0.012]} rotation={[0, 0, -0.9]}>
        <cylinderGeometry args={[0.002, 0.0015, 0.04, 4]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      {/* Back legs */}
      <mesh position={[0.018, 0, -0.005]} rotation={[-0.3, -0.3, 0.7]}>
        <cylinderGeometry args={[0.002, 0.0015, 0.045, 4]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[-0.018, 0, -0.005]} rotation={[-0.3, 0.3, -0.7]}>
        <cylinderGeometry args={[0.002, 0.0015, 0.045, 4]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
    </group>
  );
}

export function CreatureModel({ creature, worldWidth, worldHeight }: CreatureProps) {
  switch (creature.type) {
    case 'bug':
      return <Bug creature={creature} worldWidth={worldWidth} worldHeight={worldHeight} />;
    case 'snail':
      return <Snail creature={creature} worldWidth={worldWidth} worldHeight={worldHeight} />;
    case 'butterfly':
      return <Butterfly creature={creature} worldWidth={worldWidth} worldHeight={worldHeight} />;
    case 'caterpillar':
      return <Caterpillar creature={creature} worldWidth={worldWidth} worldHeight={worldHeight} />;
    case 'ant':
      return <Ant creature={creature} worldWidth={worldWidth} worldHeight={worldHeight} />;
    default:
      return null;
  }
}
