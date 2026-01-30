import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
// postprocessing removed - no bloom needed for daytime only
import { createWorld, updateWorld } from './world/index';
import type { World } from './world/index';
import { Scene } from './components/Scene';
import './App.css';

// World updater inside R3F - no React state churn
function WorldUpdater({ world, isPaused }: { world: World; isPaused: boolean }) {
  const frameRef = useRef(0);
  
  useFrame(() => {
    if (isPaused) return;
    
    // Update at ~20fps (every 3rd frame at 60fps)
    frameRef.current++;
    if (frameRef.current % 3 === 0) {
      updateWorld(world);
    }
  });
  
  return null;
}

function App() {
  const worldRef = useRef<World | null>(null);
  const [worldReady, setWorldReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [rainOverride, setRainOverride] = useState<boolean | null>(null); // null = auto, true = on, false = off

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    worldRef.current = createWorld(width, height);
    setWorldReady(true);
  }, []);

  const getTimeOfDay = () => {
    if (!worldRef.current) return 'Day';
    const phase = worldRef.current.dayPhase;
    if (phase < 0.2) return 'Night';
    if (phase < 0.3) return 'Dawn';
    if (phase < 0.7) return 'Day';
    if (phase < 0.8) return 'Dusk';
    return 'Night';
  };

  const getWeatherEmoji = () => {
    if (!worldRef.current) return '☀️';
    switch (worldRef.current.weather) {
      case 'rain': return '🌧️';
      case 'windy': return '💨';
      default: return '☀️';
    }
  };

  if (!worldReady || !worldRef.current) {
    return <div className="loading">Growing world...</div>;
  }

  return (
    <div className="app">
      <Canvas
        shadows
        dpr={[1, 1.5]} // Limit pixel ratio for performance
        camera={{ position: [0, 8, 12], fov: 60 }}
        style={{ background: '#1a1a2e' }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <WorldUpdater world={worldRef.current} isPaused={isPaused} />
        <Scene world={worldRef.current} rainOverride={rainOverride} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={60}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
      
      <div className="controls">
        <button onClick={() => setIsPaused(!isPaused)} className="control-btn">
          {isPaused ? '▶️' : '⏸️'}
        </button>
        <button 
          onClick={() => setRainOverride(prev => prev === true ? false : true)} 
          className={`control-btn ${rainOverride === true ? 'active' : ''}`}
          title="Toggle rain"
        >
          🌧️
        </button>
        <button onClick={() => setShowInfo(!showInfo)} className="control-btn">
          ℹ️
        </button>
      </div>

      {showInfo && worldRef.current && (
        <div className="info-panel">
          <h3>🌿 Tiny World</h3>
          <p>{getWeatherEmoji()} {getTimeOfDay()}</p>
          <p>🐛 {worldRef.current.creatures.length} creatures</p>
          <p>🌱 {worldRef.current.plants.length} plants</p>
          <div className="divider" />
          <p className="hint">Drag to orbit • Scroll to zoom</p>
        </div>
      )}

      <div className="title">
        <span className="title-text">tiny world</span>
      </div>
    </div>
  );
}

export default App;
