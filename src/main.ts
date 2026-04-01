import './style.css';
import { layoutAroundOrbs, fontString, getRandomPoem, type Orb, type LineData, type Poem } from './text';
import {
  playShoot, playCharDestroy, playPlanetExplode, playPlanetRespawn,
  playShipHit, playAlienSpawn, playAlienDestroy, playUpgrade,
  playGameOver, playPickup, playBossWarning, playBossDefeat,
} from './audio';
import gsap from 'gsap';

// ── Config ────────────────────────────────────
const isMobile = window.innerWidth < 600;
const FONT_SIZE = isMobile ? 18 : 26;
const LINE_HEIGHT = isMobile ? 30 : 44;
const PADDING = isMobile ? 24 : 70;
const DROP_CAP_SCALE = 3.5;
const DROP_CAP_LINES = 3;
const INITIAL_FIRE_RATE = 150; // slow at start
const INITIAL_PROJ_SPEED = 12;
const INITIAL_PROJ_W = 2;
const INITIAL_PROJ_H = 10;
const INITIAL_SHIP_SPEED = isMobile ? 5 : 4; // px per frame max

// ── DOM refs ──────────────────────────────────
const stage = document.getElementById('stage')!;
const container = document.getElementById('text-container')!;
const loading = document.getElementById('loading')!;
const flash = document.getElementById('flash')!;
const dmgVignette = document.getElementById('dmg-vignette')!;
const ship = document.getElementById('ship')!;
const starsCanvas = document.getElementById('stars') as HTMLCanvasElement;
const hpBar = document.getElementById('hp-bar')!;
const hpText = document.getElementById('hp-text')!;
const scoreDisplay = document.getElementById('score-display')!;
const levelDisplay = document.getElementById('level-display')!;
const gameOverScreen = document.getElementById('game-over')!;
const goScoreVal = document.getElementById('go-score-val')!;
const goLevelVal = document.getElementById('go-level-val')!;
const goStats = document.getElementById('go-stats')!;
const goRestart = document.getElementById('go-restart')!;
const bossHud = document.getElementById('boss-hud')!;
const bossLabel = document.getElementById('boss-label')!;
const bossHpBar = document.getElementById('boss-hp-bar')!;
const buffIndicator = document.getElementById('buff-indicator')!;
const onboardingOverlay = document.getElementById('onboarding')!;
const pauseOverlay = document.getElementById('pause-overlay')!;
const toastContainer = document.getElementById('toast-container')!;
const edgeWarnings = document.getElementById('edge-warnings')!;
const pauseBtn = document.getElementById('pause-btn')!;
const mobileFireBtn = document.getElementById('mobile-fire-btn');
const mobileMoveZone = document.getElementById('mobile-move-zone');
const moveKnob = mobileMoveZone?.querySelector('.move-knob') as HTMLElement | null;

// ── State ─────────────────────────────────────
let lines: LineData[] = [];
let lineEls: HTMLElement[] = [];
let charEls: HTMLElement[][] = [];
let dropCapEl: HTMLElement | null = null;
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;
let shipX = pointerX;
let shipY = pointerY;
let shipSpeed = INITIAL_SHIP_SPEED;
let shipAngle = -90;
let draggingPlanet: Orb | null = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let firing = false;
let lastFireTime = 0;

// ── Game State ───────────────────────────────
let score = 0;
let hp = 100;
let level = 1;
let gameOver = false;
let shipInvulnerable = 0;
let fireRate = INITIAL_FIRE_RATE;
let projSpeed = INITIAL_PROJ_SPEED;
let projW = INITIAL_PROJ_W;
let projH = INITIAL_PROJ_H;
let lastAlienSpawn = 0;
let alienSpawnInterval = 8000;
let lastHealthPack = 0;
let healthPackInterval = 25000;
let lastBuffSpawn = 0;
let buffSpawnInterval = 30000;
let killCount = 0;
let bossesDefeated = 0;
let onboardingDismissed = false;
let paused = false;
let gameStartTime = 0; // set when onboarding dismissed

// Active buffs: { name, until, badgeEl }
interface ActiveBuff { name: string; until: number; badgeEl: HTMLElement; }
const activeBuffs: ActiveBuff[] = [];

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 1800, 3000, 4500, 6500, 9000, 12000, 16000, 20000];

// Planet HP tracking (parallel to planets array)
const planetHp: number[] = [];
const planetMaxHp: number[] = [];
const planetHpEls: HTMLElement[] = [];
let dropCapDestroyed = false;
let currentPoem: Poem = getRandomPoem();
const attributionEl = document.getElementById('attribution')!;

// ── Destroyed chars tracking ─────────────────
const destroyedTextOffsets = new Set<number>();
let cachedLineTexts: string[] = [];

interface DestroyedChar {
  el: HTMLElement;
  x: number; y: number;
  vx: number; vy: number;
  rot: number; rotV: number;
  opacity: number; scale: number;
}
const destroyedChars: DestroyedChar[] = [];

interface Projectile {
  el: HTMLElement;
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  damage: number;
}
const projectiles: Projectile[] = [];

interface Alien {
  el: SVGSVGElement;
  x: number; y: number;
  r: number;
  vx: number; vy: number;
  hp: number; maxHp: number;
  speed: number;
}
const aliens: Alien[] = [];

interface Boss {
  el: HTMLElement;
  x: number; y: number;
  r: number;
  vx: number; vy: number;
  hp: number; maxHp: number;
  speed: number;
  speechTimer: number;
  active: boolean;
}
let boss: Boss | null = null;
let nextBossScore = 1500;

interface HealthPack {
  el: HTMLElement;
  x: number; y: number;
  spawnTime: number;
}
const healthPacks: HealthPack[] = [];

interface BuffPickup {
  el: HTMLElement;
  x: number; y: number;
  spawnTime: number;
  buffType: typeof BUFF_TYPES[number];
}
const buffPickups: BuffPickup[] = [];

const PM_QUOTES = [
  'Can we add one more feature?',
  "What's the ETA on this?",
  "Let's circle back",
  'Can you make it pop more?',
  'Stakeholders need this ASAP',
  'Just a small scope change',
  'Per my last email...',
  "Let's take this offline",
  'Is this agile enough?',
  'Quick sync real quick',
  'Can we leverage synergies?',
  'Moving the goalposts slightly',
];

const BUFF_TYPES = [
  { name: 'TypeScript', icon: 'devicon:typescript', color: '#3178c6', effect: 'fireRate' as const, duration: 12000 },
  { name: 'React', icon: 'devicon:react', color: '#61dafb', effect: 'shield' as const, duration: 10000 },
  { name: 'Docker', icon: 'devicon:docker', color: '#2496ed', effect: 'damage' as const, duration: 12000 },
  { name: 'Rust', icon: 'devicon:rust', color: '#dea584', effect: 'invulnerable' as const, duration: 8000 },
  { name: 'JavaScript', icon: 'devicon:javascript', color: '#f7df1e', effect: 'random' as const, duration: 10000 },
  { name: 'Python', icon: 'devicon:python', color: '#3776ab', effect: 'multishot' as const, duration: 10000 },
  { name: 'Go', icon: 'devicon:go', color: '#00add8', effect: 'speed' as const, duration: 10000 },
  { name: 'Kubernetes', icon: 'devicon:kubernetes', color: '#326ce5', effect: 'regen' as const, duration: 15000 },
  { name: 'Vue', icon: 'devicon:vuejs', color: '#4fc08d', effect: 'magnet' as const, duration: 12000 },
  { name: 'Git', icon: 'devicon:git', color: '#f05032', effect: 'rewind' as const, duration: 0 },
];

// ── Starfield ─────────────────────────────────
const starsCtx = starsCanvas.getContext('2d')!;
interface Star { x: number; y: number; r: number; speed: number; brightness: number; }
const stars: Star[] = [];

function initStars() {
  starsCanvas.width = window.innerWidth;
  starsCanvas.height = window.innerHeight;
  stars.length = 0;
  const count = isMobile ? 150 : 350;
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * starsCanvas.width,
      y: Math.random() * starsCanvas.height,
      r: Math.random() * 1.5 + 0.2,
      speed: Math.random() * 0.25 + 0.03,
      brightness: Math.random(),
    });
  }
}

function drawStars(t: number) {
  starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
  for (const s of stars) {
    const flicker = 0.5 + 0.5 * Math.sin(t * 2.5 + s.brightness * 25);
    const alpha = (0.25 + 0.75 * s.brightness) * flicker;
    starsCtx.beginPath();
    starsCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    starsCtx.fillStyle = `rgba(220, 210, 190, ${alpha})`;
    starsCtx.fill();
    s.y += s.speed;
    if (s.y > starsCanvas.height + 5) {
      s.y = -5;
      s.x = Math.random() * starsCanvas.width;
    }
  }
}

// ── Planets ───────────────────────────────────
const planetRadius = isMobile ? 40 : 75;
const sw = window.innerWidth;
const sh = window.innerHeight;
const planets: Orb[] = [
  { x: sw * 0.75, y: sh * 0.2, r: planetRadius * 1.1, vx: 0.15, vy: 0.08, className: 'planet--jupiter' },
  { x: sw * 0.25, y: sh * 0.35, r: planetRadius * 0.95, vx: 0.22, vy: 0.12, className: 'planet--saturn' },
  { x: sw * 0.6, y: sh * 0.55, r: planetRadius * 0.75, vx: -0.12, vy: 0.16, className: 'planet--earth' },
  { x: sw * 0.4, y: sh * 0.75, r: planetRadius * 0.6, vx: -0.18, vy: 0.2, className: 'planet--mars' },
  { x: sw * 0.82, y: sh * 0.7, r: planetRadius * 0.45, vx: 0.14, vy: -0.18, className: 'planet--neptune' },
];

function getPlanetMaxHp(r: number): number {
  return Math.max(3, Math.round(r / 12));
}

function createPlanetEls() {
  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    const el = document.createElement('div');
    el.className = `planet ${p.className}`;
    el.style.width = `${p.r * 2}px`;
    el.style.height = `${p.r * 2}px`;
    stage.appendChild(el);
    p.el = el;

    // HP bar element above planet
    const hpEl = document.createElement('div');
    hpEl.className = 'planet-hp-bar-wrap';
    hpEl.innerHTML = '<div class="planet-hp-bar-fill"></div>';
    hpEl.style.width = `${Math.min(p.r * 1.4, 80)}px`;
    stage.appendChild(hpEl);
    planetHpEls.push(hpEl);

    const mhp = getPlanetMaxHp(p.r);
    planetMaxHp.push(mhp);
    planetHp.push(mhp);

    syncPlanetEl(p, i);
  }
}

function syncPlanetEl(p: Orb, idx?: number) {
  if (!p.el) return;
  p.el.style.transform = `translate(${p.x - p.r}px, ${p.y - p.r}px)`;

  // Update HP bar position
  const i = idx !== undefined ? idx : planets.indexOf(p);
  if (i >= 0 && planetHpEls[i]) {
    const barW = Math.min(p.r * 1.4, 80);
    planetHpEls[i].style.left = `${p.x - barW / 2}px`;
    planetHpEls[i].style.top = `${p.y - p.r - 12}px`;
    const fill = planetHpEls[i].querySelector('.planet-hp-bar-fill') as HTMLElement;
    if (fill) fill.style.width = `${(planetHp[i] / planetMaxHp[i]) * 100}%`;
    // Only show HP bar when damaged
    planetHpEls[i].style.opacity = planetHp[i] < planetMaxHp[i] ? '1' : '0';
  }
}

// ── Pointer Events ───────────────────────────
function onPointerDown(e: PointerEvent) {
  if (paused) return;
  if (!onboardingDismissed) { dismissOnboarding(); return; }
  pointerX = e.clientX;
  pointerY = e.clientY;

  for (const p of planets) {
    if (!p.el || p.el.classList.contains('exploding')) continue;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (dx * dx + dy * dy < p.r * p.r) {
      draggingPlanet = p;
      dragOffsetX = dx;
      dragOffsetY = dy;
      p.vx = 0;
      p.vy = 0;
      e.preventDefault();
      return;
    }
  }

  if (!gameOver) {
    firing = true;
    lastFireTime = 0;
  }
}

function onPointerMove(e: PointerEvent) {
  pointerX = e.clientX;
  pointerY = e.clientY;
  if (paused) return;
  if (draggingPlanet) {
    draggingPlanet.x = e.clientX - dragOffsetX;
    draggingPlanet.y = e.clientY - dragOffsetY;
    syncPlanetEl(draggingPlanet);
  }
}

function onPointerUp() {
  draggingPlanet = null;
  firing = false;
}

stage.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);

// ── Mobile Virtual Controls ─────────────────
if (isMobile && mobileFireBtn) {
  mobileFireBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (paused || gameOver) return;
    if (!onboardingDismissed) { dismissOnboarding(); return; }
    firing = true;
    lastFireTime = 0;
    mobileFireBtn.classList.add('active');
  }, { passive: false });
  mobileFireBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    firing = false;
    mobileFireBtn.classList.remove('active');
  }, { passive: false });
  mobileFireBtn.addEventListener('touchcancel', () => {
    firing = false;
    mobileFireBtn.classList.remove('active');
  });
}

let moveZoneTouchId: number | null = null;
let moveZoneCenterX = 0;
let moveZoneCenterY = 0;
if (isMobile && mobileMoveZone && moveKnob) {
  mobileMoveZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (paused || gameOver) return;
    if (!onboardingDismissed) { dismissOnboarding(); return; }
    const t = e.changedTouches[0];
    moveZoneTouchId = t.identifier;
    const rect = mobileMoveZone.getBoundingClientRect();
    moveZoneCenterX = rect.left + rect.width / 2;
    moveZoneCenterY = rect.top + rect.height / 2;
  }, { passive: false });

  const handleMoveTouch = (e: TouchEvent) => {
    if (moveZoneTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === moveZoneTouchId) {
        const dx = t.clientX - moveZoneCenterX;
        const dy = t.clientY - moveZoneCenterY;
        const maxR = 40;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clampDist = Math.min(dist, maxR);
        const nx = dist > 0 ? dx / dist : 0;
        const ny = dist > 0 ? dy / dist : 0;
        // Move knob visual
        if (moveKnob) {
          moveKnob.style.transform = `translate(calc(-50% + ${nx * clampDist}px), calc(-50% + ${ny * clampDist}px))`;
        }
        // Set pointer target based on joystick direction and strength
        const strength = clampDist / maxR;
        const moveRange = Math.min(window.innerWidth, window.innerHeight) * 0.4;
        pointerX = shipX + nx * strength * moveRange;
        pointerY = shipY + ny * strength * moveRange;
      }
    }
  };

  window.addEventListener('touchmove', handleMoveTouch, { passive: false });
  window.addEventListener('touchend', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === moveZoneTouchId) {
        moveZoneTouchId = null;
        if (moveKnob) moveKnob.style.transform = 'translate(-50%, -50%)';
        // Stop movement by setting pointer to current ship position
        pointerX = shipX;
        pointerY = shipY;
      }
    }
  });
  window.addEventListener('touchcancel', () => {
    moveZoneTouchId = null;
    if (moveKnob) moveKnob.style.transform = 'translate(-50%, -50%)';
    pointerX = shipX;
    pointerY = shipY;
  });
}

// ── Onboarding ───────────────────────────────
function dismissOnboarding() {
  if (onboardingDismissed) return;
  onboardingDismissed = true;
  onboardingOverlay.classList.add('hidden');
  gameStartTime = performance.now();
  const now = gameStartTime;
  lastAlienSpawn = now + 12000; // delay first alien ~12s
  lastHealthPack = now + 20000;
  lastBuffSpawn = now + 18000;
}

onboardingOverlay.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  dismissOnboarding();
});
onboardingOverlay.addEventListener('keydown', dismissOnboarding);
// Also auto-dismiss after 8 seconds
setTimeout(() => dismissOnboarding(), 8000);

// ── Pause ────────────────────────────────────
function togglePause() {
  if (!onboardingDismissed || gameOver) return;
  paused = !paused;
  if (paused) {
    pauseOverlay.classList.remove('hidden');
    firing = false;
  } else {
    pauseOverlay.classList.add('hidden');
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') togglePause();
  if (!onboardingDismissed) dismissOnboarding();
});

// Mobile pause button
pauseBtn.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  e.preventDefault();
  togglePause();
});

// Tap pause overlay to resume (mobile-friendly)
pauseOverlay.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  if (paused) togglePause();
});

// Prevent context menu on long press (mobile)
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ── Ship Cursor ───────────────────────────────
function getEffectiveShipSpeed(): number {
  let spd = shipSpeed;
  if (activeBuffs.some(b => b.name === 'Go')) spd *= 1.5;
  return spd;
}

function updateShip() {
  // Smooth movement: shipX/shipY lerp toward pointer with max speed
  const dx = pointerX - shipX;
  const dy = pointerY - shipY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxSpeed = getEffectiveShipSpeed();

  if (dist > 1) {
    if (dist <= maxSpeed) {
      shipX = pointerX;
      shipY = pointerY;
    } else {
      shipX += (dx / dist) * maxSpeed;
      shipY += (dy / dist) * maxSpeed;
    }

    // Rotation tracks movement direction
    const target = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    let diff = target - shipAngle;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    shipAngle += diff * 0.15;
  }

  // Clamp ship to viewport bounds
  const margin = 18;
  shipX = Math.max(margin, Math.min(window.innerWidth - margin, shipX));
  shipY = Math.max(margin, Math.min(window.innerHeight - margin, shipY));

  ship.style.transform = `translate(${shipX - 18}px, ${shipY - 18}px) rotate(${shipAngle}deg)`;

  // Mobile reticle
  if (isMobile) {
    const reticle = document.getElementById('mobile-reticle');
    if (reticle) reticle.style.transform = `translate(${shipX - 12}px, ${shipY - 12}px)`;
  }

  // Invulnerability blink
  const now = performance.now();
  if (now < shipInvulnerable && !gameOver) {
    ship.classList.add('invulnerable');
  } else {
    ship.classList.remove('invulnerable');
  }
}

// ── Toast Notifications ──────────────────────
function showToast(text: string, color: string) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  el.style.color = color;
  el.style.borderColor = color + '60';
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 2100);
}

// ── Floating Score Popup ──────────────────────
function showScorePopup(x: number, y: number, pts: number, color: string) {
  const el = document.createElement('div');
  el.className = 'score-popup';
  el.textContent = `+${pts}`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

// ── Projectiles ───────────────────────────────
function getEffectiveFireRate(): number {
  let rate = fireRate;
  if (activeBuffs.some(b => b.name === 'TypeScript')) rate *= 0.5;
  return rate;
}

function getEffectiveDamage(): number {
  let dmg = 1;
  if (activeBuffs.some(b => b.name === 'Docker')) dmg = 2;
  return dmg;
}

function fireProjectile() {
  playShoot();
  ship.classList.add('firing');
  setTimeout(() => ship.classList.remove('firing'), 60);

  const angleRad = (shipAngle - 90) * (Math.PI / 180);
  const speed = projSpeed;
  const hasMultishot = activeBuffs.some(b => b.name === 'Python');

  const angles = hasMultishot
    ? [angleRad - 0.15, angleRad, angleRad + 0.15]
    : [angleRad];

  for (const a of angles) {
    const el = document.createElement('div');
    el.className = 'projectile';
    el.style.width = `${projW}px`;
    el.style.height = `${projH}px`;
    el.style.transform = `rotate(${shipAngle}deg)`;
    document.body.appendChild(el);

    projectiles.push({
      el,
      x: shipX + Math.cos(a) * 20,
      y: shipY + Math.sin(a) * 20,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 60,
      damage: getEffectiveDamage(),
    });
  }
}

function tickProjectiles() {
  if (firing && !draggingPlanet && !gameOver) {
    const now = performance.now();
    if (now - lastFireTime >= getEffectiveFireRate()) {
      fireProjectile();
      lastFireTime = now;
    }
  }

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    p.el.style.left = `${p.x - projW / 2}px`;
    p.el.style.top = `${p.y - projH / 2}px`;

    if (p.life <= 0 || p.x < -50 || p.x > window.innerWidth + 50 || p.y < -50 || p.y > window.innerHeight + 50) {
      p.el.remove();
      projectiles.splice(i, 1);
      continue;
    }

    // Planet hits
    let hitSomething = false;
    for (let pi = 0; pi < planets.length; pi++) {
      const planet = planets[pi];
      if (!planet.el || planet.el.classList.contains('exploding') || planet.el.style.display === 'none') continue;
      const dx = p.x - planet.x;
      const dy = p.y - planet.y;
      if (dx * dx + dy * dy < planet.r * planet.r) {
        planetHp[pi] -= p.damage;
        spawnExplosion(p.x, p.y, '#fff', 3);
        if (planetHp[pi] <= 0) {
          explodePlanet(planet, pi);
        } else {
          // Flash on hit
          planet.el.style.filter = 'brightness(1.8)';
          setTimeout(() => { if (planet.el) planet.el.style.filter = ''; }, 80);
          syncPlanetEl(planet, pi);
        }
        p.el.remove();
        projectiles.splice(i, 1);
        hitSomething = true;
        break;
      }
    }
    if (hitSomething) continue;

    // Boss hit
    if (boss && boss.active) {
      const dx = p.x - boss.x;
      const dy = p.y - boss.y;
      if (dx * dx + dy * dy < boss.r * boss.r) {
        boss.hp -= p.damage;
        spawnExplosion(p.x, p.y, '#ff6644', 4);
        if (boss.hp <= 0) {
          defeatBoss();
        } else {
          bossHpBar.style.width = `${(boss.hp / boss.maxHp) * 100}%`;
          boss.el.style.filter = 'brightness(2)';
          setTimeout(() => { if (boss?.el) boss.el.style.filter = ''; }, 60);
        }
        p.el.remove();
        projectiles.splice(i, 1);
        continue;
      }
    }

    // Alien hits
    let hitAlien = false;
    for (let ai = aliens.length - 1; ai >= 0; ai--) {
      const a = aliens[ai];
      const adx = p.x - a.x;
      const ady = p.y - a.y;
      if (adx * adx + ady * ady < (a.r + 4) * (a.r + 4)) {
        a.hp -= p.damage;
        if (a.hp <= 0) {
          destroyAlien(a, ai);
        } else {
          a.el.style.filter = 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.9))';
          setTimeout(() => {
            if (a.el.parentNode) a.el.style.filter = 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.6))';
          }, 80);
        }
        p.el.remove();
        projectiles.splice(i, 1);
        hitAlien = true;
        break;
      }
    }
    if (hitAlien) continue;

    // Drop cap hit
    if (dropCapEl && !dropCapDestroyed) {
      const dcRect = dropCapEl.getBoundingClientRect();
      if (p.x >= dcRect.left - 4 && p.x <= dcRect.right + 4 &&
          p.y >= dcRect.top - 4 && p.y <= dcRect.bottom + 4) {
        destroyDropCap(p.vx, p.vy);
        p.el.remove();
        projectiles.splice(i, 1);
        continue;
      }
    }

    // Character hits
    checkCharHit(p, i);
  }
}

function checkCharHit(proj: Projectile, projIdx: number) {
  for (let li = 0; li < charEls.length; li++) {
    for (let ci = 0; ci < charEls[li].length; ci++) {
      const ch = charEls[li][ci];
      if (ch.classList.contains('destroyed')) continue;
      const rect = ch.getBoundingClientRect();
      if (proj.x >= rect.left - 4 && proj.x <= rect.right + 4 &&
          proj.y >= rect.top - 4 && proj.y <= rect.bottom + 4) {
        destroyChar(ch, proj.vx, proj.vy);
        proj.el.remove();
        projectiles.splice(projIdx, 1);
        return;
      }
    }
  }
}

function destroyChar(el: HTMLElement, pvx: number, pvy: number) {
  el.classList.add('destroyed');
  playCharDestroy();

  // Track by absolute text offset
  const offset = el.dataset.offset;
  if (offset) destroyedTextOffsets.add(Number(offset));

  const pts = 10;
  addScore(pts);

  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  showScorePopup(cx, cy - 10, pts, '#c4a265');
  spawnExplosion(cx, cy, '#c4a265', 5);
  killCount++;

  destroyedChars.push({
    el,
    x: rect.left,
    y: rect.top,
    vx: pvx * 0.4 + (Math.random() - 0.5) * 8,
    vy: pvy * 0.4 + (Math.random() - 0.5) * 8 - 2,
    rot: 0,
    rotV: (Math.random() - 0.5) * 20,
    opacity: 1,
    scale: 1,
  });
}

function destroyDropCap(pvx: number, pvy: number) {
  if (!dropCapEl || dropCapDestroyed) return;
  dropCapDestroyed = true;
  destroyedTextOffsets.add(0); // offset 0 = first character
  playCharDestroy();

  const pts = 50;
  addScore(pts);
  killCount++;

  const rect = dropCapEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  showScorePopup(cx, cy - 15, pts, '#c4a265');
  spawnExplosion(cx, cy, '#c4a265', 12);
  spawnShockwave(cx, cy, '#c4a265');

  // Animate the drop cap flying away
  destroyedChars.push({
    el: dropCapEl,
    x: rect.left, y: rect.top,
    vx: pvx * 0.3 + (Math.random() - 0.5) * 6,
    vy: pvy * 0.3 - 3,
    rot: 0, rotV: (Math.random() - 0.5) * 15,
    opacity: 1, scale: 1,
  });
}

function tickDestroyedChars() {
  for (let i = destroyedChars.length - 1; i >= 0; i--) {
    const d = destroyedChars[i];
    d.x += d.vx;
    d.y += d.vy;
    d.vy += 0.2;
    d.vx *= 0.99;
    d.rot += d.rotV;
    d.opacity -= 0.015;
    d.scale *= 0.993;

    if (d.opacity <= 0) {
      d.el.style.opacity = '0';
      destroyedChars.splice(i, 1);
      continue;
    }

    d.el.style.position = 'fixed';
    d.el.style.left = `${d.x}px`;
    d.el.style.top = `${d.y}px`;
    d.el.style.transform = `rotate(${d.rot}deg) scale(${d.scale})`;
    d.el.style.opacity = `${d.opacity}`;
    d.el.style.color = '#c4a265';
  }
}

// ── Explosions ────────────────────────────────
function spawnExplosion(x: number, y: number, color: string, count?: number) {
  const n = count ?? (isMobile ? 10 : 16);
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    const size = Math.random() * 5 + 2;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.background = color;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.boxShadow = `0 0 ${size * 3}px ${color}`;
    document.body.appendChild(el);

    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const speed = Math.random() * 6 + 3;

    gsap.to(el, {
      x: Math.cos(angle) * speed * 35,
      y: Math.sin(angle) * speed * 35,
      opacity: 0,
      scale: 0,
      duration: 0.5 + Math.random() * 0.5,
      ease: 'power2.out',
      onComplete: () => el.remove(),
    });
  }
}

function spawnShockwave(x: number, y: number, color: string) {
  const ring = document.createElement('div');
  ring.className = 'shockwave';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  ring.style.borderColor = color;
  document.body.appendChild(ring);

  gsap.fromTo(ring,
    { scale: 0.2, opacity: 0.8 },
    { scale: 3, opacity: 0, duration: 0.6, ease: 'power2.out', onComplete: () => ring.remove() },
  );
}

// ── Planet Explosions ─────────────────────────
function getPlanetColor(planet: Orb): string {
  return planet.className.includes('jupiter') ? '#dab07a'
    : planet.className.includes('saturn') ? '#f0b840'
    : planet.className.includes('earth') ? '#6bb5e0'
    : planet.className.includes('mars') ? '#d97757'
    : '#5bc4c4';
}

function explodePlanet(planet: Orb, idx: number) {
  if (!planet.el) return;
  playPlanetExplode();

  const pts = Math.round(planet.r * 2);
  addScore(pts);
  const color = getPlanetColor(planet);
  showScorePopup(planet.x, planet.y - planet.r - 10, pts, color);
  killCount++;

  spawnExplosion(planet.x, planet.y, color, 24);
  spawnExplosion(planet.x, planet.y, '#fff', 10);
  spawnShockwave(planet.x, planet.y, color);

  flash.classList.add('active');
  setTimeout(() => flash.classList.remove('active'), 120);

  stage.style.transform = `translate(${(Math.random() - 0.5) * 10}px, ${(Math.random() - 0.5) * 10}px)`;
  setTimeout(() => { stage.style.transform = ''; }, 120);

  planet.el.classList.add('exploding');
  if (planetHpEls[idx]) planetHpEls[idx].style.opacity = '0';

  setTimeout(() => {
    if (planet.el) planet.el.style.display = 'none';
  }, 500);

  setTimeout(() => {
    if (!planet.el) return;
    playPlanetRespawn();

    const margin = planet.r + 50;
    planet.x = margin + Math.random() * (window.innerWidth - margin * 2);
    planet.y = margin + Math.random() * (window.innerHeight - margin * 2);
    planet.vx = (Math.random() - 0.5) * 0.4;
    planet.vy = (Math.random() - 0.5) * 0.4;

    // Reset HP
    planetHp[idx] = planetMaxHp[idx];

    syncPlanetEl(planet, idx);

    planet.el.style.display = '';
    planet.el.classList.remove('exploding');
    planet.el.style.opacity = '0';
    planet.el.style.transform = `translate(${planet.x - planet.r}px, ${planet.y - planet.r}px) scale(0)`;

    gsap.to(planet.el, {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: 'back.out(1.5)',
      onUpdate: () => syncPlanetEl(planet, idx),
    });
  }, 4000);
}

// ── Planet Physics ────────────────────────────
function tickPlanets() {
  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    if (p === draggingPlanet || !p.el || p.el.classList.contains('exploding') || p.el.style.display === 'none') continue;

    p.x += p.vx;
    p.y += p.vy;

    // Planet-planet separation
    for (let j = i + 1; j < planets.length; j++) {
      const q = planets[j];
      if (!q.el || q.el.classList.contains('exploding') || q.el.style.display === 'none') continue;
      const dx = p.x - q.x;
      const dy = p.y - q.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const minDist = p.r + q.r + 10;
      if (d < minDist && d > 0) {
        const push = (minDist - d) * 0.15;
        p.x += (dx / d) * push;
        p.y += (dy / d) * push;
        q.x -= (dx / d) * push;
        q.y -= (dy / d) * push;
      }
    }

    const margin = p.r;
    if (p.x - margin < 0) { p.vx = Math.abs(p.vx); p.x = margin; }
    if (p.x + margin > window.innerWidth) { p.vx = -Math.abs(p.vx); p.x = window.innerWidth - margin; }
    if (p.y - margin < 0) { p.vy = Math.abs(p.vy); p.y = margin; }
    if (p.y + margin > window.innerHeight) { p.vy = -Math.abs(p.vy); p.y = window.innerHeight - margin; }

    syncPlanetEl(p, i);
  }
}

// ── Drop cap measurement (cached) ─────────────
const dcFontSize = FONT_SIZE * DROP_CAP_SCALE;
const _dcMeasureCtx = document.createElement('canvas').getContext('2d')!;
_dcMeasureCtx.font = fontString(dcFontSize);
const dcWidth = _dcMeasureCtx.measureText('I').width + 16;
const dcHeight = LINE_HEIGHT * DROP_CAP_LINES;

// ── Text Layout & Rendering ───────────────────
function reflow() {
  const activePlanets = planets.filter(p => p.el && !p.el.classList.contains('exploding') && p.el.style.display !== 'none');

  const hudClearance = isMobile ? 50 : 65;
  lines = layoutAroundOrbs(
    currentPoem.text,
    FONT_SIZE,
    LINE_HEIGHT,
    window.innerWidth,
    window.innerHeight,
    PADDING,
    activePlanets,
    { width: dcWidth, height: dcHeight },
    hudClearance,
  );

  // Check if DOM rebuild is needed (line texts changed)
  const needsRebuild = lines.length !== cachedLineTexts.length ||
    lines.some((l, i) => l.text !== cachedLineTexts[i]);

  // Ensure we have enough line elements
  while (lineEls.length > lines.length) {
    const el = lineEls.pop()!;
    el.remove();
    charEls.pop();
  }

  if (needsRebuild) {
    cachedLineTexts = lines.map(l => l.text);
    rebuildCharSpans();
  }

  // Always update positions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let lineX = line.x;
    if (i === 0) lineX = PADDING + dcWidth;
    lineEls[i].style.left = `${lineX}px`;
    lineEls[i].style.top = `${line.y}px`;
  }

  renderDropCap();
}

function rebuildCharSpans() {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let el = lineEls[i];

    if (!el) {
      el = document.createElement('div');
      el.className = 'line';
      el.style.fontSize = `${FONT_SIZE}px`;
      container.appendChild(el);
      lineEls.push(el);
      charEls.push([]);
    }

    let displayText = line.text;
    let textStartOffset = line.startOffset;

    if (i === 0) {
      displayText = line.text.slice(1);
      textStartOffset += 1;
    }

    el.textContent = '';
    const newCharEls: HTMLElement[] = [];
    for (let c = 0; c < displayText.length; c++) {
      const span = document.createElement('span');
      span.className = 'ch';
      const absOffset = textStartOffset + c;
      span.dataset.offset = String(absOffset);

      if (destroyedTextOffsets.has(absOffset)) {
        span.classList.add('destroyed');
        span.style.opacity = '0';
        span.style.pointerEvents = 'none';
      }

      span.textContent = displayText[c] === ' ' ? '\u00A0' : displayText[c];
      el.appendChild(span);
      newCharEls.push(span);
    }
    charEls[i] = newCharEls;

    el.style.opacity = '1';
    el.style.transform = '';
  }
}

function renderDropCap() {
  if (lines.length === 0) return;
  if (dropCapDestroyed) return;
  const firstChar = lines[0].text[0];

  if (!dropCapEl) {
    dropCapEl = document.createElement('div');
    dropCapEl.className = 'drop-cap';
    container.appendChild(dropCapEl);
  }

  dropCapEl.textContent = firstChar;
  dropCapEl.style.fontSize = `${dcFontSize}px`;
  dropCapEl.style.left = `${lines[0].x}px`;
  dropCapEl.style.top = `${lines[0].y}px`;
  dropCapEl.style.width = `${dcWidth}px`;
}

// ── Kinetic Effects ───────────────────────────
function tickKinetic(t: number) {
  for (let li = 0; li < lineEls.length; li++) {
    const el = lineEls[li];
    const line = lines[li];
    if (!line) continue;

    const cy = line.y + LINE_HEIGHT / 2;
    const cx = line.x + line.width / 2;
    const dx = cx - shipX;
    const dy = cy - shipY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = isMobile ? 100 : 160;

    if (dist < radius && dist > 0) {
      const force = (1 - dist / radius) * (isMobile ? 5 : 10);
      el.style.transform = `translate(${(dx / dist) * force}px, ${(dy / dist) * force}px)`;
    } else {
      const wave = Math.sin(t * 0.5 + li * 0.35) * 1.2;
      el.style.transform = `translateY(${wave}px)`;
    }
  }

  if (dropCapEl) {
    const floatY = Math.sin(t * 0.6) * 3;
    const glow = 0.35 + Math.sin(t * 0.4) * 0.15;
    dropCapEl.style.transform = `translateY(${floatY}px)`;
    dropCapEl.style.textShadow = `
      0 0 ${25 + glow * 30}px rgba(196, 162, 101, ${glow + 0.15}),
      0 0 ${50 + glow * 50}px rgba(196, 162, 101, ${glow * 0.35}),
      0 0 90px rgba(196, 162, 101, 0.06)`;
  }
}

// ── HUD ──────────────────────────────────────
function updateHUD() {
  const clampedHp = Math.max(0, Math.round(hp));
  hpBar.style.width = `${clampedHp}%`;
  hpText.textContent = `${clampedHp}`;
  scoreDisplay.textContent = `${score}`;
  levelDisplay.textContent = `LVL ${level}`;

  if (hp <= 25) {
    hpBar.classList.add('low');
    hpBar.style.background = '';
  } else {
    hpBar.classList.remove('low');
    if (hp <= 50) {
      hpBar.style.background = 'linear-gradient(90deg, #d97757, #c4a265)';
    } else {
      hpBar.style.background = 'linear-gradient(90deg, #5bc4c4, #c4a265, #5bc4c4)';
    }
  }
}

function addScore(pts: number) {
  score += pts;
  const newLevel = LEVEL_THRESHOLDS.findIndex((_, i) =>
    i === LEVEL_THRESHOLDS.length - 1 || score < LEVEL_THRESHOLDS[i + 1]
  ) + 1;
  if (newLevel > level) {
    level = newLevel;
    applyUpgrades();
    playUpgrade();
    showLevelUpFlash();
  }

  // Boss trigger
  if (score >= nextBossScore && !boss) {
    spawnBoss();
    nextBossScore += 2500 + level * 500;
  }
}

function getUpgradeText(): string {
  const upgrades: string[] = [];
  const newFireRate = Math.max(35, INITIAL_FIRE_RATE - (level - 1) * 13);
  const prevFireRate = Math.max(35, INITIAL_FIRE_RATE - (level - 2) * 13);
  if (newFireRate < prevFireRate) upgrades.push('fire rate up');
  const newProjSpeed = INITIAL_PROJ_SPEED + (level - 1) * 2;
  const prevProjSpeed = INITIAL_PROJ_SPEED + (level - 2) * 2;
  if (newProjSpeed > prevProjSpeed) upgrades.push('projectile speed up');
  if (level % 2 === 0) upgrades.push('enemies faster');
  return upgrades.slice(0, 2).join(' + ');
}

function showLevelUpFlash() {
  const el = document.createElement('div');
  el.className = 'level-up-flash';
  const upgradeText = getUpgradeText();
  el.innerHTML = `LEVEL ${level}${upgradeText ? `<div class="level-up-sub">${upgradeText}</div>` : ''}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);

  showToast(`LVL ${level}`, '#5bc4c4');

  levelDisplay.style.color = '#fff';
  levelDisplay.style.textShadow = '0 0 20px #fff';
  setTimeout(() => {
    levelDisplay.style.color = '';
    levelDisplay.style.textShadow = '';
  }, 600);
}

function applyUpgrades() {
  // Progressive ship upgrades
  fireRate = Math.max(35, INITIAL_FIRE_RATE - (level - 1) * 13);
  projSpeed = INITIAL_PROJ_SPEED + (level - 1) * 2;
  projW = Math.min(5, INITIAL_PROJ_W + (level - 1) * 0.3);
  projH = Math.min(18, INITIAL_PROJ_H + (level - 1) * 0.8);

  // Ship speed scales with level
  shipSpeed = Math.min(12, INITIAL_SHIP_SPEED + (level - 1) * 0.7);
  // Aliens spawn faster and more
  alienSpawnInterval = Math.max(2000, 8000 - (level - 1) * 500);
  // Health packs slightly more frequent at high levels
  healthPackInterval = Math.max(15000, 25000 - (level - 1) * 800);
}


// Forward declarations (replaced in next commits)
function destroyAlien(_a: Alien, _i: number) {}
function defeatBoss() {}
function spawnBoss() {}
