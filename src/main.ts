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

