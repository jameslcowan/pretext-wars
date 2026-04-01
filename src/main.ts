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

