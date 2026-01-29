import type { World, Creature, Plant, Particle, Vector2 } from './types';
import { createPlant } from './create';

const randomInRange = (min: number, max: number) => 
  Math.random() * (max - min) + min;

function distance(a: Vector2, b: Vector2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function normalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x ** 2 + v.y ** 2);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function updateCreature(creature: Creature, world: World): void {
  const speeds: Record<string, number> = { bug: 0.8, snail: 0.2, butterfly: 1.2, caterpillar: 0.3, ant: 1.0 };
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
      creature.vel = { 
        x: Math.cos(angle) * speed, 
        y: Math.sin(angle) * speed 
      };
    } else if (rand < 0.85) {
      creature.state = 'rest';
      creature.stateTimer = randomInRange(60, 180);
      creature.vel = { x: 0, y: 0 };
    } else {
      // Look for nearby plant to eat
      const nearbyPlant = world.plants.find(p => 
        distance(creature.pos, p.pos) < 50 && p.size > 3
      );
      if (nearbyPlant) {
        creature.state = 'eat';
        creature.stateTimer = randomInRange(60, 120);
        const dir = normalize({ 
          x: nearbyPlant.pos.x - creature.pos.x, 
          y: nearbyPlant.pos.y - creature.pos.y 
        });
        creature.vel = { x: dir.x * speed * 0.5, y: dir.y * speed * 0.5 };
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
    const nearbyPlant = world.plants.find(p => 
      distance(creature.pos, p.pos) < 15 && p.size > 2
    );
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
  
  // Old plants might spawn new ones
  if (plant.age > 2000 && plant.size > plant.maxSize * 0.8 && Math.random() < 0.0005) {
    const offset = { 
      x: randomInRange(-40, 40), 
      y: randomInRange(-40, 40) 
    };
    const newPos = { 
      x: Math.max(30, Math.min(world.width - 30, plant.pos.x + offset.x)),
      y: Math.max(30, Math.min(world.height - 30, plant.pos.y + offset.y))
    };
    if (world.plants.length < 300) {
      world.plants.push(createPlant(plant.type, world.width, world.height, newPos, true));
    }
  }
  
  // Remove very small eaten plants
  if (plant.size < 0.5) {
    const idx = world.plants.indexOf(plant);
    if (idx > -1) world.plants.splice(idx, 1);
  }
}

function updateParticles(world: World): void {
  // Update existing particles
  world.particles = world.particles.filter(p => {
    p.pos.x += p.vel.x;
    p.pos.y += p.vel.y;
    p.life--;
    return p.life > 0 && p.pos.y < world.height;
  });
  
  // Rain particles
  if (world.weather === 'rain' && Math.random() < 0.3) {
    world.particles.push({
      pos: { x: Math.random() * world.width, y: -5 },
      vel: { x: -0.5, y: 3 },
      life: 200,
      maxLife: 200,
      size: 2,
      color: '#a0c4e8',
    });
  }
  
  // Occasional floating particles (pollen, dust)
  if (world.weather === 'clear' && Math.random() < 0.02) {
    world.particles.push({
      pos: { x: Math.random() * world.width, y: world.height + 5 },
      vel: { x: randomInRange(-0.2, 0.2), y: randomInRange(-0.5, -0.2) },
      life: 300,
      maxLife: 300,
      size: 2,
      color: '#fff8dc',
    });
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
  
  // Day/night cycle (very slow - full cycle ~10 minutes)
  world.dayPhase = (world.dayPhase + 0.00005) % 1;
  
  // Update all entities
  world.creatures.forEach(c => updateCreature(c, world));
  world.plants.forEach(p => updatePlant(p, world));
  updateParticles(world);
  updateWeather(world);
}
