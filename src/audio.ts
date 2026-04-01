// Procedural sound effects using Web Audio API -- no external files needed

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function playShoot() {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);

  osc.type = 'square';
  osc.frequency.setValueAtTime(880, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(220, ac.currentTime + 0.08);
  gain.gain.setValueAtTime(0.08, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);

  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.1);
}

export function playCharDestroy() {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);

  const freq = 300 + Math.random() * 400;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.15);
  gain.gain.setValueAtTime(0.06, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);

  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.15);
}

export function playPlanetExplode() {
  const ac = getCtx();

  const rumble = ac.createOscillator();
  const rumbleGain = ac.createGain();
  rumble.connect(rumbleGain);
  rumbleGain.connect(ac.destination);
  rumble.type = 'sawtooth';
  rumble.frequency.setValueAtTime(60, ac.currentTime);
  rumble.frequency.exponentialRampToValueAtTime(20, ac.currentTime + 0.5);
  rumbleGain.gain.setValueAtTime(0.12, ac.currentTime);
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
  rumble.start(ac.currentTime);
  rumble.stop(ac.currentTime + 0.5);

  const bufferSize = ac.sampleRate * 0.3;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ac.createGain();
  noise.connect(noiseGain);
  noiseGain.connect(ac.destination);
  noiseGain.gain.setValueAtTime(0.15, ac.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
  noise.start(ac.currentTime);
}

export function playPlanetRespawn() {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ac.currentTime + 0.4);
  gain.gain.setValueAtTime(0.0001, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0.06, ac.currentTime + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);

  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.5);
}

export function playShipHit() {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.2);
  gain.gain.setValueAtTime(0.1, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);

  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.25);
}

export function playAlienSpawn() {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(400, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ac.currentTime + 0.15);
  osc.frequency.exponentialRampToValueAtTime(400, ac.currentTime + 0.3);
  gain.gain.setValueAtTime(0.05, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);

  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.35);
}

export function playAlienDestroy() {
  const ac = getCtx();

  const osc1 = ac.createOscillator();
  const gain1 = ac.createGain();
  osc1.connect(gain1);
  gain1.connect(ac.destination);
  osc1.type = 'square';
  osc1.frequency.setValueAtTime(600, ac.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(100, ac.currentTime + 0.2);
  gain1.gain.setValueAtTime(0.08, ac.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
  osc1.start(ac.currentTime);
  osc1.stop(ac.currentTime + 0.25);

  const osc2 = ac.createOscillator();
  const gain2 = ac.createGain();
  osc2.connect(gain2);
  gain2.connect(ac.destination);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(900, ac.currentTime + 0.05);
  osc2.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.3);
  gain2.gain.setValueAtTime(0.06, ac.currentTime + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
  osc2.start(ac.currentTime + 0.05);
  osc2.stop(ac.currentTime + 0.35);
}

export function playUpgrade() {
  const ac = getCtx();
  const notes = [523, 659, 784];
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    const t = ac.currentTime + i * 0.08;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}

export function playGameOver() {
  const ac = getCtx();
  const notes = [440, 370, 311, 261];
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    const t = ac.currentTime + i * 0.2;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

export function playPickup() {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.1);
  gain.gain.setValueAtTime(0.07, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);

  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.15);
}

export function playBossWarning() {
  const ac = getCtx();
  for (let i = 0; i < 3; i++) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'square';
    const t = ac.currentTime + i * 0.2;
    osc.frequency.setValueAtTime(200, t);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.start(t);
    osc.stop(t + 0.12);
  }
}

export function playBossDefeat() {
  const ac = getCtx();
  const notes = [261, 329, 392, 523, 659, 784];
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    const t = ac.currentTime + i * 0.06;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}
