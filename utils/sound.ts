
// Simple Web Audio API wrapper for sound effects without external files

let audioCtx: AudioContext | null = null;
let bgmGainNode: GainNode | null = null;
let isBgmEnabled = false;
let nextNoteTime = 0;
let schedulerTimer: number | null = null;

// BPM and Timing
const TEMPO = 110;
const SECONDS_PER_BEAT = 60 / TEMPO;
const LOOKAHEAD = 25.0; // ms
const SCHEDULE_AHEAD_TIME = 0.1; // s

// Frequencies
const F = {
  r: 0,
  G2: 98.00, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50
};

// Original Composition: "Chihuahua March"
// Melody Track (Note, Duration in beats)
const SCORE_MELODY = [
  // Intro (16 beats)
  {f: F.G4, d: 0.33}, {f: F.G4, d: 0.33}, {f: F.G4, d: 0.34}, {f: F.C5, d: 3}, // Fanfare
  {f: F.A4, d: 0.5}, {f: F.B4, d: 0.5}, {f: F.C5, d: 0.5}, {f: F.D5, d: 0.5}, {f: F.E5, d: 2}, // Run up
  {f: F.F5, d: 1}, {f: F.E5, d: 1}, {f: F.D5, d: 1}, {f: F.C5, d: 1},
  {f: F.D5, d: 3}, {f: F.G4, d: 1},

  // Main Theme (32 beats)
  {f: F.C5, d: 1.5}, {f: F.D5, d: 0.5}, {f: F.E5, d: 1}, {f: F.C5, d: 1}, // Bar 1
  {f: F.F5, d: 1}, {f: F.E5, d: 1}, {f: F.D5, d: 1}, {f: F.G4, d: 1}, // Bar 2
  {f: F.C5, d: 1}, {f: F.D5, d: 1}, {f: F.E5, d: 1}, {f: F.F5, d: 1}, // Bar 3
  {f: F.G5, d: 3}, {f: F.G4, d: 1}, // Bar 4
  
  {f: F.A5, d: 1.5}, {f: F.G5, d: 0.5}, {f: F.F5, d: 1}, {f: F.E5, d: 1}, // Bar 5
  {f: F.D5, d: 1}, {f: F.E5, d: 1}, {f: F.F5, d: 1}, {f: F.D5, d: 1}, // Bar 6
  {f: F.E5, d: 1.5}, {f: F.D5, d: 0.5}, {f: F.C5, d: 1}, {f: F.B4, d: 1}, // Bar 7
  {f: F.C5, d: 4} // Bar 8
];

// Bass Track
const SCORE_BASS = [
  // Intro (16 beats)
  {f: F.C3, d: 1}, {f: F.C3, d: 1}, {f: F.C3, d: 1}, {f: F.C3, d: 1},
  {f: F.C3, d: 1}, {f: F.C3, d: 1}, {f: F.C3, d: 1}, {f: F.C3, d: 1},
  {f: F.F3, d: 1}, {f: F.F3, d: 1}, {f: F.G3, d: 1}, {f: F.G3, d: 1},
  {f: F.G3, d: 1}, {f: F.G3, d: 1}, {f: F.G3, d: 1}, {f: F.G3, d: 1},

  // Main Theme (32 beats)
  {f: F.C3, d: 2}, {f: F.G3, d: 2},
  {f: F.G3, d: 2}, {f: F.C3, d: 2},
  {f: F.C3, d: 2}, {f: F.A3, d: 2},
  {f: F.G3, d: 2}, {f: F.G3, d: 2},
  {f: F.F3, d: 2}, {f: F.C3, d: 2},
  {f: F.G3, d: 2}, {f: F.G3, d: 2},
  {f: F.C3, d: 2}, {f: F.G3, d: 2},
  {f: F.C3, d: 4}
];

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// --- BGM Logic ---

let melodyIndex = 0;
let bassIndex = 0;
let melodyNextTime = 0;
let bassNextTime = 0;

function playNote(ctx: AudioContext, freq: number, type: OscillatorType, startTime: number, duration: number, vol: number) {
  if (freq <= 0) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  
  // Envelope
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
  gain.gain.setValueAtTime(vol, startTime + duration - 0.05);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  // Connect to BGM Master Gain
  if (!bgmGainNode) {
    bgmGainNode = ctx.createGain();
    bgmGainNode.gain.value = 0.15; // Master BGM volume
    bgmGainNode.connect(ctx.destination);
  }
  
  osc.connect(gain);
  gain.connect(bgmGainNode);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

function scheduler() {
  if (!isBgmEnabled || !audioCtx) return;

  // Schedule Melody
  while (melodyNextTime < audioCtx.currentTime + SCHEDULE_AHEAD_TIME) {
    const note = SCORE_MELODY[melodyIndex % SCORE_MELODY.length];
    // Sawtooth for brassy/heroic lead
    playNote(audioCtx, note.f, 'sawtooth', melodyNextTime, note.d * SECONDS_PER_BEAT, 0.15);
    melodyNextTime += note.d * SECONDS_PER_BEAT;
    melodyIndex++;
  }

  // Schedule Bass
  while (bassNextTime < audioCtx.currentTime + SCHEDULE_AHEAD_TIME) {
    const note = SCORE_BASS[bassIndex % SCORE_BASS.length];
    // Triangle for softer bass
    playNote(audioCtx, note.f, 'triangle', bassNextTime, note.d * SECONDS_PER_BEAT, 0.2);
    bassNextTime += note.d * SECONDS_PER_BEAT;
    bassIndex++;
  }

  schedulerTimer = window.setTimeout(scheduler, LOOKAHEAD);
}

export const toggleBGM = (enabled: boolean) => {
  const ctx = initAudio();
  isBgmEnabled = enabled;

  if (enabled) {
    if (bgmGainNode) {
      bgmGainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1);
    }
    
    // Reset if starting fresh
    if (schedulerTimer === null) {
      melodyIndex = 0;
      bassIndex = 0;
      melodyNextTime = ctx.currentTime + 0.1;
      bassNextTime = ctx.currentTime + 0.1;
      scheduler();
    }
  } else {
    // Fade out
    if (bgmGainNode) {
      bgmGainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    }
    if (schedulerTimer) {
      clearTimeout(schedulerTimer);
      schedulerTimer = null;
    }
  }
};

// --- SFX Logic ---

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0, vol: number = 0.1) => {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
  
  gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration);
};

export const playClick = () => {
  // If BGM is supposed to be on but context was suspended (e.g. mobile), this wakes it up
  initAudio(); 
  playTone(800, 'sine', 0.1, 0, 0.05);
};

export const playConfirm = () => {
  playTone(1200, 'sine', 0.1, 0, 0.1);
  playTone(1800, 'sine', 0.2, 0.05, 0.1);
};

export const playDepart = () => {
  playTone(400, 'triangle', 0.3, 0, 0.2);
  playTone(600, 'triangle', 0.5, 0.1, 0.2);
  playTone(1000, 'triangle', 0.8, 0.2, 0.1);
};

export const playFanfare = () => {
  const ctx = initAudio();
  
  // Major Arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
  notes.forEach((freq, i) => {
    playTone(freq, 'square', 0.4, i * 0.1, 0.1);
  });
  
  // Final Chord
  setTimeout(() => {
     playTone(523.25, 'triangle', 1.0, 0, 0.1);
     playTone(659.25, 'triangle', 1.0, 0, 0.1);
     playTone(783.99, 'triangle', 1.0, 0, 0.1);
     playTone(1046.50, 'triangle', 1.0, 0, 0.1);
  }, 400);
};

export const playGachaReveal = () => {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.5);
  
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 1.0);
  
  setTimeout(() => {
    playTone(1200, 'sine', 0.1, 0, 0.1);
    playTone(1500, 'sine', 0.1, 0.1, 0.1);
    playTone(1800, 'sine', 0.2, 0.2, 0.1);
    playTone(2400, 'square', 0.4, 0.3, 0.05);
  }, 300);
};

export const playError = () => {
  playTone(200, 'sawtooth', 0.3, 0, 0.2);
  playTone(150, 'sawtooth', 0.3, 0.1, 0.2);
};
