import type { World, Creature, Plant, Vector2 } from './types';

// Seeded random for consistent world generation
let seed = 12345;
function seededRandom() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function resetSeed() {
  seed = 12345;
}

const randomId = () => Math.random().toString(36).slice(2, 9);

const randomInRange = (min: number, max: number) => 
  seededRandom() * (max - min) + min;

const creatureColors: Record<Creature['type'], string[]> = {
  bug: ['#5d4e37', '#8b7355', '#6b8e23'],
  snail: ['#deb887', '#d2b48c', '#bc8f8f'],
  butterfly: ['#ffb6c1', '#87ceeb', '#dda0dd', '#f0e68c'],
  caterpillar: ['#7cb342', '#8bc34a', '#9ccc65', '#c5e1a5', '#ffeb3b'],
};

const plantColors: Record<Plant['type'], string[]> = {
  flower: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff8fb1'],
  grass: ['#228b22', '#32cd32', '#90ee90', '#3cb371'],
  mushroom: ['#f5deb3', '#ffe4c4', '#ffdab9', '#e6c89c'],
  blade: ['#1e7a1e', '#2d8a2d', '#3d9a3d', '#228b22', '#2e8b2e'],
  daisy: ['#ffffff', '#fff8dc', '#fffaf0'],
  tulip: ['#e91e63', '#9c27b0', '#ff5722', '#ffeb3b', '#f44336'],
  wildflower: ['#ba68c8', '#7986cb', '#4fc3f7', '#81c784', '#ffb74d'],
};

export function createCreature(type: Creature['type'], worldWidth: number, worldHeight: number): Creature {
  const colors = creatureColors[type];
  const sizes = { bug: 4, snail: 6, butterfly: 5, caterpillar: 5 };
  
  return {
    id: randomId(),
    pos: { 
      x: randomInRange(20, worldWidth - 20), 
      y: randomInRange(20, worldHeight - 20) 
    },
    vel: { x: 0, y: 0 },
    size: sizes[type] + randomInRange(-1, 1),
    color: colors[Math.floor(seededRandom() * colors.length)],
    type,
    state: 'wander',
    stateTimer: randomInRange(60, 180),
    energy: 100,
  };
}

export function createPlant(type: Plant['type'], worldWidth: number, worldHeight: number, pos?: Vector2): Plant {
  const colors = plantColors[type];
  const maxSizes = { flower: 12, grass: 8, mushroom: 10, blade: 6, daisy: 10, tulip: 14, wildflower: 8 };
  
  return {
    id: randomId(),
    pos: pos || { 
      x: randomInRange(30, worldWidth - 30), 
      y: randomInRange(30, worldHeight - 30) 
    },
    size: randomInRange(1, 3),
    maxSize: maxSizes[type] + randomInRange(-2, 4),
    growthRate: randomInRange(0.002, 0.008),
    color: colors[Math.floor(seededRandom() * colors.length)],
    type,
    age: 0,
  };
}

export function createWorld(width: number, height: number): World {
  resetSeed(); // Consistent world generation
  const creatures: Creature[] = [];
  const plants: Plant[] = [];
  
  // Add some bugs
  for (let i = 0; i < 8; i++) {
    creatures.push(createCreature('bug', width, height));
  }
  
  // Add snails
  for (let i = 0; i < 5; i++) {
    creatures.push(createCreature('snail', width, height));
  }
  
  // Add butterflies - fluttering above the meadow
  for (let i = 0; i < 12; i++) {
    creatures.push(createCreature('butterfly', width, height));
  }
  
  // Add caterpillars - crawling on the ground
  for (let i = 0; i < 8; i++) {
    creatures.push(createCreature('caterpillar', width, height));
  }
  
  // Add flowers - scattered naturally
  for (let i = 0; i < 40; i++) {
    plants.push(createPlant('flower', width, height));
  }
  
  // Add daisies
  for (let i = 0; i < 25; i++) {
    plants.push(createPlant('daisy', width, height));
  }
  
  // Add tulips
  for (let i = 0; i < 20; i++) {
    plants.push(createPlant('tulip', width, height));
  }
  
  // Add wildflowers
  for (let i = 0; i < 30; i++) {
    plants.push(createPlant('wildflower', width, height));
  }
  
  // Add grass patches - dense like real nature
  for (let i = 0; i < 300; i++) {
    plants.push(createPlant('grass', width, height));
  }
  
  // Add mushrooms - clustered in patches
  for (let i = 0; i < 12; i++) {
    plants.push(createPlant('mushroom', width, height));
  }
  
  // Add single grass blades scattered everywhere
  for (let i = 0; i < 200; i++) {
    plants.push(createPlant('blade', width, height));
  }
  
  return {
    width,
    height,
    creatures,
    plants,
    particles: [],
    time: 0,
    weather: 'clear',
    dayPhase: 0.35, // Start in early morning
  };
}
