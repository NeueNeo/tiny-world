export interface Vector2 {
  x: number;
  y: number;
}

export interface Creature {
  id: string;
  pos: Vector2;
  vel: Vector2;
  size: number;
  color: string;
  type: 'bug' | 'snail' | 'butterfly' | 'caterpillar' | 'ant' | 'dragonfly' | 'bee';
  state: 'wander' | 'rest' | 'eat';
  stateTimer: number;
  energy: number;
}

export interface Plant {
  id: string;
  pos: Vector2;
  size: number;
  maxSize: number;
  growthRate: number;
  color: string;
  type: 'flower' | 'grass' | 'mushroom' | 'blade' | 'daisy' | 'tulip' | 'wildflower' | 'poppy' | 'moss';
  age: number;
}

export interface World {
  width: number;
  height: number;
  creatures: Creature[];
  plants: Plant[];
  time: number;
  weather: 'clear' | 'rain' | 'windy';
  dayPhase: number; // 0-1, 0=midnight, 0.5=noon
}
