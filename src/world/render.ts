import type { World, Creature, Plant, Particle } from './types';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);
  
  const r1 = (c1 >> 16) & 255, g1 = (c1 >> 8) & 255, b1 = c1 & 255;
  const r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255;
  
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  
  return `rgb(${r},${g},${b})`;
}

function getSkyColor(dayPhase: number): string {
  // 0 = midnight, 0.25 = dawn, 0.5 = noon, 0.75 = dusk
  if (dayPhase < 0.2) {
    // Night to dawn
    return lerpColor('#1a1a2e', '#ff9966', dayPhase / 0.2);
  } else if (dayPhase < 0.3) {
    // Dawn to day
    return lerpColor('#ff9966', '#87ceeb', (dayPhase - 0.2) / 0.1);
  } else if (dayPhase < 0.7) {
    // Day
    return '#87ceeb';
  } else if (dayPhase < 0.8) {
    // Day to dusk
    return lerpColor('#87ceeb', '#ff7f50', (dayPhase - 0.7) / 0.1);
  } else if (dayPhase < 0.9) {
    // Dusk to night
    return lerpColor('#ff7f50', '#1a1a2e', (dayPhase - 0.8) / 0.1);
  } else {
    // Night
    return '#1a1a2e';
  }
}

function getGroundColor(dayPhase: number): string {
  const dayGround = '#8fbc8f';
  const nightGround = '#2d4a2d';
  const brightness = Math.sin(dayPhase * Math.PI) * 0.5 + 0.5;
  return lerpColor(nightGround, dayGround, brightness);
}

function renderCreature(ctx: CanvasRenderingContext2D, creature: Creature, time: number): void {
  const { pos, size, color, type, state } = creature;
  
  ctx.save();
  ctx.translate(pos.x, pos.y);
  
  // Bobbing animation
  const bob = Math.sin(time * 0.1 + pos.x) * (state === 'rest' ? 0.5 : 1.5);
  
  if (type === 'bug') {
    // Simple oval body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, bob, size, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Little legs
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * size * 0.5, bob);
      ctx.lineTo(i * size * 0.8, bob + size * 0.5);
      ctx.stroke();
    }
  } else if (type === 'snail') {
    // Shell
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-size * 0.2, bob - size * 0.3, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    // Shell spiral
    ctx.strokeStyle = '#00000033';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-size * 0.2, bob - size * 0.3, size * 0.4, 0, Math.PI * 1.5);
    ctx.stroke();
    // Body
    ctx.fillStyle = '#9a8b7a';
    ctx.beginPath();
    ctx.ellipse(size * 0.3, bob, size * 0.6, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eye stalks
    ctx.strokeStyle = '#9a8b7a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(size * 0.5, bob - size * 0.1);
    ctx.lineTo(size * 0.7, bob - size * 0.4);
    ctx.moveTo(size * 0.6, bob - size * 0.1);
    ctx.lineTo(size * 0.8, bob - size * 0.35);
    ctx.stroke();
  } else if (type === 'butterfly') {
    // Wings with flapping
    const flap = Math.sin(time * 0.3) * 0.3;
    ctx.fillStyle = color + 'cc';
    // Left wing
    ctx.save();
    ctx.rotate(-0.3 - flap);
    ctx.beginPath();
    ctx.ellipse(-size * 0.5, bob, size, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Right wing
    ctx.save();
    ctx.rotate(0.3 + flap);
    ctx.beginPath();
    ctx.ellipse(size * 0.5, bob, size, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Body
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(0, bob, size * 0.15, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function renderPlant(ctx: CanvasRenderingContext2D, plant: Plant, time: number): void {
  const { pos, size, color, type } = plant;
  
  ctx.save();
  ctx.translate(pos.x, pos.y);
  
  // Gentle sway
  const sway = Math.sin(time * 0.02 + pos.x * 0.1) * 2;
  
  if (type === 'flower') {
    // Stem
    ctx.strokeStyle = '#228b22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(sway, -size * 0.5, sway * 0.5, -size);
    ctx.stroke();
    // Petals
    ctx.fillStyle = color;
    const petalCount = 5;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        sway * 0.5 + Math.cos(angle) * size * 0.3,
        -size + Math.sin(angle) * size * 0.3,
        size * 0.25,
        size * 0.15,
        angle,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    // Center
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(sway * 0.5, -size, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'grass') {
    // Multiple blades
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 2, 0);
      ctx.quadraticCurveTo(sway + i, -size * 0.6, sway * 0.7 + i * 0.5, -size);
      ctx.stroke();
    }
  } else if (type === 'mushroom') {
    // Stem
    ctx.fillStyle = '#f5f5dc';
    ctx.beginPath();
    ctx.moveTo(-size * 0.15, 0);
    ctx.lineTo(-size * 0.1, -size * 0.6);
    ctx.lineTo(size * 0.1, -size * 0.6);
    ctx.lineTo(size * 0.15, 0);
    ctx.closePath();
    ctx.fill();
    // Cap
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.6, size * 0.5, size * 0.35, 0, Math.PI, 0);
    ctx.fill();
    // Spots
    ctx.fillStyle = '#ffffff88';
    ctx.beginPath();
    ctx.arc(-size * 0.15, -size * 0.7, size * 0.08, 0, Math.PI * 2);
    ctx.arc(size * 0.1, -size * 0.65, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function renderParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
  const alpha = particle.life / particle.maxLife;
  ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
  ctx.beginPath();
  ctx.arc(particle.pos.x, particle.pos.y, particle.size, 0, Math.PI * 2);
  ctx.fill();
}

export function renderWorld(ctx: CanvasRenderingContext2D, world: World): void {
  const { width, height, dayPhase, weather } = world;
  
  // Sky gradient
  const skyColor = getSkyColor(dayPhase);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, skyColor);
  gradient.addColorStop(1, getGroundColor(dayPhase));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Ground
  ctx.fillStyle = getGroundColor(dayPhase);
  ctx.fillRect(0, height * 0.75, width, height * 0.25);
  
  // Ground texture
  ctx.fillStyle = '#00000011';
  for (let i = 0; i < 50; i++) {
    const x = (i * 37) % width;
    const y = height * 0.75 + ((i * 23) % (height * 0.25));
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Rain overlay
  if (weather === 'rain') {
    ctx.fillStyle = '#00000022';
    ctx.fillRect(0, 0, width, height);
  }
  
  // Render particles (behind plants)
  world.particles.forEach(p => renderParticle(ctx, p));
  
  // Sort plants by y position for depth
  const sortedPlants = [...world.plants].sort((a, b) => a.pos.y - b.pos.y);
  sortedPlants.forEach(p => renderPlant(ctx, p, world.time));
  
  // Sort creatures by y position for depth
  const sortedCreatures = [...world.creatures].sort((a, b) => a.pos.y - b.pos.y);
  sortedCreatures.forEach(c => renderCreature(ctx, c, world.time));
  
  // Night overlay with stars
  if (dayPhase > 0.8 || dayPhase < 0.2) {
    const nightAlpha = dayPhase > 0.8 
      ? (dayPhase - 0.8) / 0.2 
      : (0.2 - dayPhase) / 0.2;
    
    ctx.fillStyle = `rgba(0, 0, 20, ${nightAlpha * 0.3})`;
    ctx.fillRect(0, 0, width, height);
    
    // Stars
    ctx.fillStyle = `rgba(255, 255, 255, ${nightAlpha})`;
    for (let i = 0; i < 30; i++) {
      const x = (i * 47 + 13) % width;
      const y = (i * 31 + 7) % (height * 0.6);
      const twinkle = Math.sin(world.time * 0.05 + i) * 0.5 + 0.5;
      ctx.globalAlpha = nightAlpha * twinkle;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
