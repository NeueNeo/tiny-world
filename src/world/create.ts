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
  ant: ['#1a1a1a', '#2d1f1f', '#3d2b2b', '#4a3c3c'],
  dragonfly: ['#1e90ff', '#00ced1', '#32cd32', '#dc143c', '#4169e1', '#2f4f4f'], // Blue, cyan, green, red, royal blue, dark teal
  bee: ['#f4a020', '#e8a000', '#d4940a', '#c98a00'], // Golden yellow variants
};

const plantColors: Record<Plant['type'], string[]> = {
  flower: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff8fb1'],
  grass: ['#228b22', '#32cd32', '#90ee90', '#3cb371'],
  mushroom: ['#f5deb3', '#ffe4c4', '#ffdab9', '#e6c89c'],
  blade: ['#1e7a1e', '#2d8a2d', '#3d9a3d', '#228b22', '#2e8b2e'],
  daisy: ['#ffffff', '#fff8dc', '#fffaf0'],
  tulip: ['#e91e63', '#9c27b0', '#ff5722', '#ffeb3b', '#f44336'],
  wildflower: ['#ba68c8', '#7986cb', '#4fc3f7', '#81c784', '#ffb74d'],
  poppy: ['#e63946', '#ff6b35', '#f77f00', '#ffba08'], // Red, orange, deep orange, golden
  moss: ['#5a7247', '#6b8e4e', '#4a6741', '#3d5a35', '#7da668', '#8fbc6f'], // Mix of light and dark greens
};

export function createCreature(type: Creature['type'], worldWidth: number, worldHeight: number): Creature {
  const colors = creatureColors[type];
  const sizes: Record<Creature['type'], number> = { bug: 4, snail: 6, butterfly: 5, caterpillar: 5, ant: 2.1, dragonfly: 6, bee: 3 };
  
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

export function createPlant(type: Plant['type'], worldWidth: number, worldHeight: number, pos?: Vector2, startSmall?: boolean): Plant {
  const colors = plantColors[type];
  const maxSizes: Record<Plant['type'], number> = { flower: 12, grass: 8, mushroom: 10, blade: 6, daisy: 10, tulip: 14, wildflower: 8, poppy: 8, moss: 8 };
  const maxSize = maxSizes[type] + randomInRange(-2, 4);
  
  return {
    id: randomId(),
    pos: pos || { 
      x: randomInRange(30, worldWidth - 30), 
      y: randomInRange(30, worldHeight - 30) 
    },
    // Start at full size unless explicitly told to start small (for new spawns)
    size: startSmall ? randomInRange(1, 3) : maxSize * randomInRange(0.8, 1.0),
    maxSize,
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
  for (let i = 0; i < 10; i++) {
    creatures.push(createCreature('bug', width, height));
  }
  
  // Add snails
  for (let i = 0; i < 7; i++) {
    creatures.push(createCreature('snail', width, height));
  }
  
  // Add butterflies - fluttering above the meadow
  for (let i = 0; i < 12; i++) {
    creatures.push(createCreature('butterfly', width, height));
  }
  
  // Add dragonflies - hovering and darting
  for (let i = 0; i < 4; i++) {
    creatures.push(createCreature('dragonfly', width, height));
  }
  
  // Add bees - buzzing around flowers
  for (let i = 0; i < 8; i++) {
    creatures.push(createCreature('bee', width, height));
  }
  
  // Add caterpillars - crawling on the ground
  for (let i = 0; i < 10; i++) {
    creatures.push(createCreature('caterpillar', width, height));
  }
  
  // Add ants - tiny and quick
  for (let i = 0; i < 80; i++) {
    creatures.push(createCreature('ant', width, height));
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
  
  // Add small wildflowers
  for (let i = 0; i < 20; i++) {
    const smallWild = createPlant('wildflower', width, height);
    smallWild.size *= 0.5;
    smallWild.maxSize *= 0.5;
    plants.push(smallWild);
  }
  
  // Add poppies - delicate cup-shaped meadow flowers
  for (let i = 0; i < 10; i++) {
    plants.push(createPlant('poppy', width, height));
  }
  
  // Add grass patches - dense like real nature
  for (let i = 0; i < 350; i++) {
    plants.push(createPlant('grass', width, height));
  }
  
  // Add mushrooms - half scattered, half in patches
  // Scattered mushrooms
  for (let i = 0; i < 6; i++) {
    plants.push(createPlant('mushroom', width, height));
  }
  // Mushroom patches - 6 patches with 2-3 mushrooms each, loosely grouped
  for (let patch = 0; patch < 6; patch++) {
    const patchCenterX = randomInRange(60, width - 60);
    const patchCenterY = randomInRange(60, height - 60);
    const mushroomsInPatch = 2 + Math.floor(seededRandom() * 2); // 2-3 per patch
    for (let m = 0; m < mushroomsInPatch; m++) {
      const offsetX = randomInRange(-25, 25);
      const offsetY = randomInRange(-25, 25);
      const pos = {
        x: Math.max(30, Math.min(width - 30, patchCenterX + offsetX)),
        y: Math.max(30, Math.min(height - 30, patchCenterY + offsetY))
      };
      plants.push(createPlant('mushroom', width, height, pos));
    }
  }
  
  // Add single grass blades scattered everywhere
  for (let i = 0; i < 220; i++) {
    plants.push(createPlant('blade', width, height));
  }
  
  // Add moss clumps - they grow in patches on the ground
  // Scattered moss cushions
  for (let i = 0; i < 25; i++) {
    plants.push(createPlant('moss', width, height));
  }
  // Moss patches - 10 patches with 4-8 cushions each, tightly grouped
  for (let patch = 0; patch < 10; patch++) {
    const patchCenterX = randomInRange(50, width - 50);
    const patchCenterY = randomInRange(50, height - 50);
    const mossInPatch = 4 + Math.floor(seededRandom() * 5); // 4-8 per patch
    for (let m = 0; m < mossInPatch; m++) {
      const offsetX = randomInRange(-20, 20);
      const offsetY = randomInRange(-20, 20);
      const pos = {
        x: Math.max(20, Math.min(width - 20, patchCenterX + offsetX)),
        y: Math.max(20, Math.min(height - 20, patchCenterY + offsetY))
      };
      plants.push(createPlant('moss', width, height, pos));
    }
  }
  // Wide moss patches - 7 larger spreading clumps
  for (let patch = 0; patch < 7; patch++) {
    const patchCenterX = randomInRange(80, width - 80);
    const patchCenterY = randomInRange(80, height - 80);
    const mossInPatch = 10 + Math.floor(seededRandom() * 8); // 10-17 per wide patch
    for (let m = 0; m < mossInPatch; m++) {
      const offsetX = randomInRange(-50, 50); // Wider spread
      const offsetY = randomInRange(-50, 50);
      const pos = {
        x: Math.max(20, Math.min(width - 20, patchCenterX + offsetX)),
        y: Math.max(20, Math.min(height - 20, patchCenterY + offsetY))
      };
      const wideMoss = createPlant('moss', width, height, pos);
      wideMoss.size *= 1.3 + seededRandom() * 0.5; // Slightly larger cushions
      plants.push(wideMoss);
    }
  }
  // Extra-large moss patches - 2 sprawling areas
  for (let patch = 0; patch < 2; patch++) {
    const patchCenterX = randomInRange(100, width - 100);
    const patchCenterY = randomInRange(100, height - 100);
    const mossInPatch = 25 + Math.floor(seededRandom() * 15); // 25-40 per patch
    for (let m = 0; m < mossInPatch; m++) {
      const offsetX = randomInRange(-90, 90); // Much wider spread
      const offsetY = randomInRange(-90, 90);
      const pos = {
        x: Math.max(20, Math.min(width - 20, patchCenterX + offsetX)),
        y: Math.max(20, Math.min(height - 20, patchCenterY + offsetY))
      };
      const bigMoss = createPlant('moss', width, height, pos);
      bigMoss.size *= 1.5 + seededRandom() * 0.8;
      plants.push(bigMoss);
    }
  }
  
  // Large moss mounds - 2x size scattered around
  for (let i = 0; i < 5; i++) {
    const largeMoss = createPlant('moss', width, height);
    largeMoss.size *= 2;
    largeMoss.maxSize *= 2;
    plants.push(largeMoss);
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
