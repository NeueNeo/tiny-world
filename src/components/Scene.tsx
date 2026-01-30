import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color } from 'three';
import { Ground } from './Ground';
import { InstancedGrass } from './InstancedGrass';
import { InstancedFlowers, InstancedFlatFlowers, InstancedMushrooms } from './InstancedPlants';
import { InstancedMoss } from './InstancedMoss';
import { InstancedSticks } from './InstancedSticks';
import { InstancedAnts, InstancedBugs, InstancedCaterpillars, InstancedButterflies, InstancedSnails } from './InstancedCreatures';
import { InstancedDragonflies } from './InstancedDragonflies';
import { InstancedBees } from './InstancedBees';
import { InstancedRain } from './InstancedRain';
import { InstancedFireflies } from './InstancedFireflies';
import type { World } from '../world/types';

interface SceneProps {
  world: World;
  rainOverride?: boolean | null; // null = auto (use world.weather), true = force on, false = force off
}

export function Scene({ world, rainOverride }: SceneProps) {
  const { scene } = useThree();
  
  // Determine if it's raining
  const isRaining = rainOverride === true || (rainOverride === null && world.weather === 'rain');
  
  // Sky colors - reuse single Color object to avoid GC pressure
  const dayColor = useMemo(() => new Color('#87CEEB'), []);       // Light blue
  const nightColor = useMemo(() => new Color('#1a1a3e'), []);     // Dark blue
  const rainyDayColor = useMemo(() => new Color('#6b7b8a'), []);  // Gray-blue overcast
  const rainyNightColor = useMemo(() => new Color('#2a2a3a'), []); // Darker gray-blue
  const skyColor = useMemo(() => new Color(), []);                // Reusable for interpolation
  
  // Sun position calculated each frame
  const getSunPosition = (dayPhase: number): [number, number, number] => {
    const angle = dayPhase * Math.PI * 2 - Math.PI / 2;
    const height = Math.sin(dayPhase * Math.PI) * 20;
    const distance = 30;
    return [
      Math.cos(angle) * distance,
      Math.max(2, height),
      Math.sin(angle) * distance * 0.5,
    ];
  };
  
  // Update sky color based on day phase and weather
  useFrame(() => {
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
    
    if (isRaining) {
      // Rainy sky - interpolate between rainy night and rainy day
      skyColor.lerpColors(rainyNightColor, rainyDayColor, brightness);
    } else {
      // Clear sky - interpolate between night and day
      skyColor.lerpColors(nightColor, dayColor, brightness);
    }
    
    scene.background = skyColor;
  });
  
  // Calculate light intensity based on day phase and weather
  const isDay = world.dayPhase >= 0.25 && world.dayPhase <= 0.75;
  const lightIntensity = isDay ? (isRaining ? 0.6 : 1.2) : (isRaining ? 0.2 : 0.4);
  const ambientIntensity = isDay ? (isRaining ? 0.4 : 0.5) : (isRaining ? 0.15 : 0.2);
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={getSunPosition(world.dayPhase)}
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
      
      {/* Ground debris */}
      <InstancedSticks />
      
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
      <InstancedFlatFlowers 
        plants={world.plants} 
        worldWidth={world.width} 
        worldHeight={world.height} 
      />
      <InstancedMushrooms 
        plants={world.plants} 
        worldWidth={world.width} 
        worldHeight={world.height} 
      />
      <InstancedMoss
        plants={world.plants}
        worldWidth={world.width}
        worldHeight={world.height}
      />
      
      {/* Instanced creatures */}
      <InstancedAnts
        creatures={world.creatures}
        worldWidth={world.width}
        worldHeight={world.height}
      />
      <InstancedBugs
        creatures={world.creatures}
        worldWidth={world.width}
        worldHeight={world.height}
      />
      <InstancedCaterpillars
        creatures={world.creatures}
        worldWidth={world.width}
        worldHeight={world.height}
      />
      <InstancedButterflies
        creatures={world.creatures}
        worldWidth={world.width}
        worldHeight={world.height}
      />
      <InstancedSnails
        creatures={world.creatures}
        worldWidth={world.width}
        worldHeight={world.height}
      />
      <InstancedDragonflies
        creatures={world.creatures}
        worldWidth={world.width}
        worldHeight={world.height}
      />
      <InstancedBees
        creatures={world.creatures}
        worldWidth={world.width}
        worldHeight={world.height}
      />
      
      {/* Instanced rain particles */}
      {(rainOverride === true || (rainOverride === null && world.weather === 'rain')) && (
        <InstancedRain />
      )}
      
      {/* Fireflies - only at dusk/night */}
      <InstancedFireflies count={30} dayPhase={world.dayPhase} />
    </>
  );
}
