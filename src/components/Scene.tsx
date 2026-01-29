import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color } from 'three';
import { Ground } from './Ground';
import { CreatureModel } from './Creatures';
import { InstancedGrass } from './InstancedGrass';
import { InstancedFlowers, InstancedMushrooms } from './InstancedPlants';
import type { World } from '../world/types';

interface SceneProps {
  world: World;
}

export function Scene({ world }: SceneProps) {
  const { scene } = useThree();
  const sunPosition = useRef<[number, number, number]>([10, 10, 10]);
  
  // Sky colors
  const dayColor = useMemo(() => new Color('#87CEEB'), []);    // Light blue
  const nightColor = useMemo(() => new Color('#1a1a3e'), []);  // Dark blue
  
  // Update sun position and sky color based on day phase
  useFrame(() => {
    const angle = world.dayPhase * Math.PI * 2 - Math.PI / 2;
    const height = Math.sin(world.dayPhase * Math.PI) * 20;
    const distance = 30;
    sunPosition.current = [
      Math.cos(angle) * distance,
      Math.max(2, height),
      Math.sin(angle) * distance * 0.5,
    ];
    
    // Interpolate sky color based on day phase
    // 0.3-0.7 is full day, outside that it transitions to night
    let brightness: number;
    if (world.dayPhase >= 0.3 && world.dayPhase <= 0.7) {
      brightness = 1;
    } else if (world.dayPhase < 0.3) {
      brightness = world.dayPhase / 0.3;
    } else {
      brightness = (1 - world.dayPhase) / 0.3;
    }
    
    const skyColor = new Color().lerpColors(nightColor, dayColor, brightness);
    scene.background = skyColor;
  });
  
  // Calculate light intensity based on day phase
  const lightIntensity = world.dayPhase >= 0.25 && world.dayPhase <= 0.75 ? 1.2 : 0.4;
  const ambientIntensity = world.dayPhase >= 0.25 && world.dayPhase <= 0.75 ? 0.5 : 0.2;
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={sunPosition.current}
        intensity={lightIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Ground */}
      <Ground />
      
      {/* All plants use instancing for performance */}
      <InstancedGrass 
        plants={world.plants} 
        worldWidth={world.width} 
        worldHeight={world.height} 
      />
      <InstancedFlowers 
        plants={world.plants} 
        worldWidth={world.width} 
        worldHeight={world.height} 
      />
      <InstancedMushrooms 
        plants={world.plants} 
        worldWidth={world.width} 
        worldHeight={world.height} 
      />
      
      {/* Creatures */}
      {world.creatures.map((creature) => (
        <CreatureModel
          key={creature.id}
          creature={creature}
          worldWidth={world.width}
          worldHeight={world.height}
        />
      ))}
      
      {/* Rain particles */}
      {world.weather === 'rain' && (
        <RainEffect />
      )}
    </>
  );
}

function RainEffect() {
  const rainRef = useRef<any>(null);
  
  useFrame((state) => {
    if (rainRef.current) {
      rainRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });
  
  // Simple rain using instanced lines would be better, but for now just darken the scene
  return (
    <mesh ref={rainRef} position={[0, 15, 0]}>
      <boxGeometry args={[60, 30, 60]} />
      <meshBasicMaterial color="#5588aa" transparent opacity={0.1} />
    </mesh>
  );
}
