import type { World, Creature, Plant, Vector2 } from './types';

const randomInRange = (min: number, max: number) => 
  Math.random() * (max - min) + min;

function distance(a: Vector2, b: Vector2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Reusable vector to avoid allocations
const _tempVec: Vector2 = { x: 0, y: 0 };

function normalize(vx: number, vy: number): Vector2 {
  const len = Math.sqrt(vx * vx + vy * vy);
  if (len === 0) {
    _tempVec.x = 0;
    _tempVec.y = 0;
  } else {
    _tempVec.x = vx / len;
    _tempVec.y = vy / len;
  }
  return _tempVec;
}

// Find nearby plant without creating closures
function findNearbyPlant(plants: Plant[], pos: Vector2, maxDist: number, minSize: number): Plant | null {
  for (let i = 0, len = plants.length; i < len; i++) {
    const p = plants[i];
    if (p.size > minSize && distance(pos, p.pos) < maxDist) {
      return p;
    }
  }
  return null;
}

function updateCreature(creature: Creature, world: World): void {
  const speeds: Record<string, number> = { bug: 0.4, snail: 0.2, butterfly: 1.2, caterpillar: 0.3, ant: 1.0 };
  const speed = speeds[creature.type] ?? 0.3;
  
  creature.stateTimer--;
  
  // State machine
  if (creature.stateTimer <= 0) {
    const rand = Math.random();
    if (rand < 0.6) {
      creature.state = 'wander';
      creature.stateTimer = randomInRange(120, 300);
      // Pick new direction
      const angle = Math.random() * Math.PI * 2;
      creature.vel.x = Math.cos(angle) * speed;
      creature.vel.y = Math.sin(angle) * speed;
    } else if (rand < 0.85) {
      creature.state = 'rest';
      creature.stateTimer = randomInRange(60, 180);
      creature.vel.x = 0;
      creature.vel.y = 0;
    } else {
      // Look for nearby plant to eat
      const nearbyPlant = findNearbyPlant(world.plants, creature.pos, 50, 3);
      if (nearbyPlant) {
        creature.state = 'eat';
        creature.stateTimer = randomInRange(60, 120);
        const dir = normalize(
          nearbyPlant.pos.x - creature.pos.x, 
          nearbyPlant.pos.y - creature.pos.y
        );
        creature.vel.x = dir.x * speed * 0.5;
        creature.vel.y = dir.y * speed * 0.5;
      } else {
        creature.state = 'wander';
        creature.stateTimer = randomInRange(60, 120);
      }
    }
  }
  
  // Butterflies have floaty movement
  if (creature.type === 'butterfly') {
    creature.vel.x += Math.sin(world.time * 0.05 + creature.pos.y * 0.01) * 0.02;
    creature.vel.y += Math.cos(world.time * 0.03 + creature.pos.x * 0.01) * 0.02;
  }
  
  // Apply velocity
  creature.pos.x += creature.vel.x;
  creature.pos.y += creature.vel.y;
  
  // Boundary wrapping with padding
  const padding = 20;
  if (creature.pos.x < padding) {
    creature.pos.x = padding;
    creature.vel.x *= -1;
  }
  if (creature.pos.x > world.width - padding) {
    creature.pos.x = world.width - padding;
    creature.vel.x *= -1;
  }
  if (creature.pos.y < padding) {
    creature.pos.y = padding;
    creature.vel.y *= -1;
  }
  if (creature.pos.y > world.height - padding) {
    creature.pos.y = world.height - padding;
    creature.vel.y *= -1;
  }
  
  // Eating behavior
  if (creature.state === 'eat') {
    const nearbyPlant = findNearbyPlant(world.plants, creature.pos, 15, 2);
    if (nearbyPlant) {
      nearbyPlant.size -= 0.01;
      creature.energy = Math.min(100, creature.energy + 0.1);
    }
  }
  
  // Slow energy drain
  creature.energy -= 0.005;
}

function updatePlant(plant: Plant, world: World): void {
  plant.age++;
  
  // Grow based on time of day (faster during day)
  const dayBonus = Math.sin(world.dayPhase * Math.PI) * 0.5 + 0.5;
  const rainBonus = world.weather === 'rain' ? 1.5 : 1;
  
  if (plant.size < plant.maxSize) {
    plant.size += plant.growthRate * dayBonus * rainBonus;
  }
  
  // Old plants might spawn new ones (disabled to prevent memory growth)
  // The initial plant count is sufficient for the scene
  
  // Keep minimum size (don't remove - causes array reallocation)
  if (plant.size < 0.5) {
    plant.size = 0.5;
  }
}

function updateWeather(world: World): void {
  // Slowly cycle weather
  if (Math.random() < 0.0003) {
    const weathers: World['weather'][] = ['clear', 'clear', 'clear', 'rain', 'windy'];
    world.weather = weathers[Math.floor(Math.random() * weathers.length)];
  }
}

export function updateWorld(world: World): void {
  world.time++;
  
  // Day/night cycle disabled - always noon
  world.dayPhase = 0.5;
  
  // Update all entities - use for loops to avoid closure allocation
  const creatures = world.creatures;
  const plants = world.plants;
  for (let i = 0, len = creatures.length; i < len; i++) {
    updateCreature(creatures[i], world);
  }
  for (let i = 0, len = plants.length; i < len; i++) {
    updatePlant(plants[i], world);
  }
  updateWeather(world);
}
