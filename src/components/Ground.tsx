import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, ShaderMaterial, Color, DoubleSide, UniformsLib, UniformsUtils } from 'three';

interface GroundProps {
  dayPhase?: number;
}

// Simplex noise GLSL functions
const noiseGLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * snoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
`;

const vertexShader = `
  #include <common>
  #include <shadowmap_pars_vertex>
  
  varying vec2 vUv;
  varying vec3 vWorldPos;
  
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    
    #include <beginnormal_vertex>
    #include <defaultnormal_vertex>
    #include <begin_vertex>
    #include <worldpos_vertex>
    #include <shadowmap_vertex>
    
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  #include <common>
  #include <packing>
  #include <shadowmap_pars_fragment>
  
  ${noiseGLSL}
  
  uniform vec3 baseColor;
  uniform vec3 darkColor;
  uniform float noiseScale;
  uniform float patchScale;
  uniform float dayPhase;
  
  varying vec2 vUv;
  varying vec3 vWorldPos;
  
  void main() {
    vec2 pos = vWorldPos.xz;
    
    // Large random dark spots - very low frequency, scattered
    float bigSpots = snoise(pos * 0.08 + 100.0);
    bigSpots = smoothstep(0.2, 0.5, bigSpots); // Creates distinct spots
    
    // Secondary large spots at different position
    float bigSpots2 = snoise(pos * 0.12 + 200.0);
    bigSpots2 = smoothstep(0.25, 0.55, bigSpots2);
    
    // Combine big spots
    float spots = max(bigSpots, bigSpots2 * 0.8);
    
    // Medium variation patches
    float medPatch = fbm(pos * 0.25 + 50.0);
    medPatch = smoothstep(-0.3, 0.5, medPatch);
    
    // Fine detail noise
    float detail = snoise(pos * noiseScale) * 0.12;
    
    // Mix: spots create dark areas, medium adds variation
    float patchMask = spots * 0.6 + medPatch * 0.3 + 0.1;
    patchMask = clamp(patchMask + detail, 0.0, 1.0);
    
    // Mix base and dark colors
    vec3 color = mix(darkColor, baseColor, patchMask);
    
    // Subtle fine variation
    color += (snoise(pos * 4.0) * 0.025);
    
    // Day/night darkening - darker at night (dayPhase near 0 or 1)
    float brightness = sin(dayPhase * 3.14159) * 0.3 + 0.7; // 0.7-1.0 range
    color *= brightness;
    
    // Apply shadows
    #ifdef USE_SHADOWMAP
      DirectionalLightShadow directionalShadow = directionalLightShadows[0];
      float shadow = getShadow(
        directionalShadowMap[0],
        directionalShadow.shadowMapSize,
        directionalShadow.shadowIntensity,
        directionalShadow.shadowBias,
        directionalShadow.shadowRadius,
        vDirectionalShadowCoord[0]
      );
      color *= mix(0.5, 1.0, shadow);
    #endif
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function Ground({ dayPhase = 0.5 }: GroundProps) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  
  // Update dayPhase uniform
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.dayPhase.value = dayPhase;
    }
  });
  
  const material = useMemo(() => {
    const mat = new ShaderMaterial({
      uniforms: UniformsUtils.merge([
        UniformsLib.lights,
        {
          baseColor: { value: new Color('#4a7c59') },      // Main grass green
          darkColor: { value: new Color('#4a4a38') },      // Darker brown-green patches
          noiseScale: { value: 2.0 },
          patchScale: { value: 0.4 },
          dayPhase: { value: 0.5 },
        }
      ]),
      vertexShader,
      fragmentShader,
      side: DoubleSide,
      lights: true,
    });
    materialRef.current = mat;
    return mat;
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);
  
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[25, 25, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
