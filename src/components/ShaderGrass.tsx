import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { 
  InstancedMesh, 
  Object3D, 
  Color, 
  BufferGeometry, 
  Float32BufferAttribute, 
  ShaderMaterial,
  DoubleSide
} from 'three';
import type { Plant } from '../world/types';

interface ShaderGrassProps {
  plants: Plant[];
  worldWidth: number;
  worldHeight: number;
}

function toSceneCoords(x: number, y: number, worldWidth: number, worldHeight: number): [number, number, number] {
  const sceneX = (x / worldWidth - 0.5) * 24;
  const sceneZ = (y / worldHeight - 0.5) * 24;
  return [sceneX, 0, sceneZ];
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Vertex shader - wind animation on GPU
const vertexShader = `
  uniform float uTime;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vHeight;
  
  void main() {
    // Get instance matrix (position, rotation, scale)
    mat4 instanceMat = instanceMatrix;
    
    // World position from instance matrix
    vec3 worldPos = (instanceMat * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    
    // Height factor - grass bends more at the top
    float heightFactor = position.y;
    vHeight = heightFactor;
    
    // Wind calculation - based on world position for spatial variation
    float windStrength = sin(uTime * 1.2 + worldPos.x * 3.0 + worldPos.z * 2.0) * 0.08;
    
    // Apply wind displacement - increases with height
    vec3 displaced = position;
    displaced.x += windStrength * heightFactor * 0.5;
    displaced.z += windStrength * heightFactor * 0.3;
    
    // Transform with instance matrix
    vec4 mvPosition = modelViewMatrix * instanceMat * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    vNormal = normalMatrix * mat3(instanceMat) * normal;
    vPosition = (modelMatrix * instanceMat * vec4(displaced, 1.0)).xyz;
  }
`;

// Fragment shader - simple green with slight variation
const fragmentShader = `
  uniform vec3 uBaseColor;
  uniform vec3 uTipColor;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vHeight;
  
  void main() {
    // Mix base and tip color based on height
    vec3 color = mix(uBaseColor, uTipColor, vHeight);
    
    // Simple directional light
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    float diff = max(dot(normalize(vNormal), lightDir), 0.0) * 0.5 + 0.5;
    
    gl_FragColor = vec4(color * diff, 1.0);
  }
`;

export function ShaderGrass({ plants, worldWidth, worldHeight }: ShaderGrassProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  
  // Tapered blade geometry
  const geometry = useMemo(() => {
    const geom = new BufferGeometry();
    
    const bottomWidth = 0.0242;  // +10%
    const topWidth = 0.0081;    // +10%
    const height = 1;
    
    const vertices = new Float32Array([
      -bottomWidth / 2, 0, 0,
       bottomWidth / 2, 0, 0,
       topWidth / 2, height, 0,
      -bottomWidth / 2, 0, 0,
       topWidth / 2, height, 0,
      -topWidth / 2, height, 0,
    ]);
    
    const normals = new Float32Array([
      0, 0, 1,  0, 0, 1,  0, 0, 1,
      0, 0, 1,  0, 0, 1,  0, 0, 1,
    ]);
    
    geom.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geom.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    
    return geom;
  }, []);
  
  // Shader material with uniforms
  const material = useMemo(() => new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBaseColor: { value: new Color('#1a6b1a') },
      uTipColor: { value: new Color('#3cb371') },
    },
    vertexShader,
    fragmentShader,
    side: DoubleSide,
  }), []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);
  
  // Calculate instances
  const grassPlants = useMemo(() => plants.filter(p => p.type === 'grass'), [plants]);
  const bladePlants = useMemo(() => plants.filter(p => p.type === 'blade'), [plants]);
  const bladesPerClump = 8;
  const totalInstances = grassPlants.length * bladesPerClump + bladePlants.length;
  
  // Pre-calculate blade data (static - no animation data needed)
  const bladeData = useMemo(() => {
    const data: { x: number; z: number; height: number; rotY: number; lean: number }[] = [];
    
    grassPlants.forEach((plant, plantIdx) => {
      const [px, , pz] = toSceneCoords(plant.pos.x, plant.pos.y, worldWidth, worldHeight);
      const scale = plant.size / 1.5;
      
      for (let i = 0; i < bladesPerClump; i++) {
        const seed = plantIdx * 100 + i;
        const angle = (i / bladesPerClump) * Math.PI * 2 + seededRandom(seed) * 0.5;
        const dist = seededRandom(seed + 1) * 0.08;
        const isShort = seededRandom(seed + 5) < 0.25;
        const heightMult = isShort ? 0.5 : 1.0;
        const height = (0.15 + seededRandom(seed + 2) * 0.35) * scale * heightMult;
        
        data.push({
          x: px + Math.cos(angle) * dist * scale,
          z: pz + Math.sin(angle) * dist * scale,
          height,
          rotY: seededRandom(seed + 3) * Math.PI,
          lean: (seededRandom(seed + 4) - 0.5) * 0.4,
        });
      }
    });
    
    bladePlants.forEach((plant, plantIdx) => {
      const [px, , pz] = toSceneCoords(plant.pos.x, plant.pos.y, worldWidth, worldHeight);
      const scale = plant.size / 1.2;
      const seed = plantIdx * 1000;
      const isShort = seededRandom(seed + 5) < 0.25;
      const heightMult = isShort ? 0.5 : 1.0;
      const height = (0.2 + seededRandom(seed) * 0.4) * scale * heightMult;
      
      data.push({
        x: px,
        z: pz,
        height,
        rotY: 0,
        lean: (seededRandom(seed + 1) - 0.5) * 0.5,
      });
    });
    
    return data;
  }, [grassPlants, bladePlants, worldWidth, worldHeight]);
  
  // Set transforms ONCE - no per-frame updates needed
  useEffect(() => {
    if (!meshRef.current) return;
    
    bladeData.forEach((blade, i) => {
      dummy.position.set(blade.x, 0, blade.z);
      dummy.rotation.set(0, blade.rotY, blade.lean);
      dummy.scale.set(1, blade.height, 1);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [bladeData, dummy]);
  
  // Only update time uniform - no matrix updates!
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });
  
  if (totalInstances === 0) return null;
  
  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, totalInstances]}
      frustumCulled={true}
    />
  );
}
