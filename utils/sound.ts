
// Simple Web Audio API wrapper for sound effects without external files

let audioCtx: AudioContext | null = null;
let bgmGainNode: GainNode | null = null;
let isSoundEnabled = false; // Renamed from isBgmEnabled to isSoundEnabled to reflect global control
let nextNoteTime = 0;
let schedulerTimer: number | null = null;

// BPM and Timing
const TEMPO = 110; // Majestic, marching tempo
const SECONDS_PER_BEAT = 60 / TEMPO;
const LOOKAHEAD = 25.0; // ms
const SCHEDULE_AHEAD_TIME = 0.1; // s

// Frequencies
const F = {
  r: 0,
  F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50
};

// "Overture to the Mine" - Epic Adventure Theme
// Melody Track (Note, Duration in beats)
const SCORE_MELODY = [
  // Intro (8 beats) - Grand Fanfare
  {f: F.C5, d: 1.5}, {f: F.G4, d: 0.5}, {f: F.C5, d: 1}, {f: F.E5, d: 1},
  {f: F.G5, d: 2}, {f: F.C6, d: 2},
  
  // Main Theme A (16 beats) - The Journey Begins
  {f: F.G5, d: 1.5}, {f: F.E5, d: 0.5}, {f: F.C5, d: 1}, {f: F.G4, d: 1},
  {f: F.A4, d: 1.5}, {f: F.F5, d: 0.5}, {f: F.E5, d: 1}, {f: F.D5, d: 1},
  {f: F.E5, d: 1}, {f: F.C5, d: 1}, {f: F.G4, d: 1}, {f: F.E4, d: 1},
  {f: F.D4, d: 2}, {f: F.G4, d: 2},
  
  // Main Theme B (16 beats) - Triumphant Return
  {f: F.G5, d: 1.5}, {f: F.E5, d: 0.5}, {f: F.C5, d: 1}, {f: F.G4, d: 1},
  {f: F.A4, d: 1.5}, {f: F.C6, d: 0.5}, {f: F.B5, d: 1}, {f: F.A5, d: 1},
  {f: F.G5, d: 1}, {f: F.E5, d: 1}, {f: F.F5, d: 1}, {f: F.D5, d: 1},
  {f: F.C5, d: 3}, {f: F.r, d: 1}
];

// Bass Track - Orchestral march feel (Timpani & Low Brass)
const SCORE_BASS = [
  // Intro (8 beats)
  {f: F.C3, d: 1}, {f: F.C3, d: 1}, {f: F.C3, d: 1}, {f: F.C3, d: 1},
  {f: F.E3, d: 1}, {f: F.E3, d: 1}, {f: F.F3, d: 1}, {f: F.G3, d: 1},
  
  // Main Theme A (16 beats)
  {f: F.C3, d: 2}, {f: F.E3, d: 2},
  {f: F.F3, d: 2}, {f: F.G3, d: 2},
  {f: F.C3, d: 2}, {f: F.E3, d: 2},
  {f: F.G2, d: 2}, {f: F.G3, d: 2},
  
  // Main Theme B (16 beats)
  {f: F.C3, d: 2}, {f: F.E3, d: 2},
  {f: F.F3, d: 2}, {f: F.D3, d: 2},
  {f: F.E3, d: 2}, {f: F.G3, d: 2},
  {f: F.C3, d: 3}, {f: F.G2, d: 1}
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

function playNote(ctx: AudioContext, freq: number, type: OscillatorType, startTime: number, duration: number, vol: number, isBass: boolean = false) {
  if (freq <= 0) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  
  // Envelope for better articulation
  const attack = isBass ? 0.05 : 0.08; // Slightly slower attack for brass/strings feel
  const decay = isBass ? 0.2 : 0.1;
  const sustain = isBass ? vol * 0.7 : vol * 0.9; // Sustained epic sound
  const release = isBass ? 0.3 : 0.2;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(sustain, startTime + attack + decay);
  gain.gain.setValueAtTime(sustain, startTime + duration - release);
  gain.gain.linearRampToValueAtTime(0.001, startTime + duration); // Prevent click

  // Filter for warmer sound
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(isBass ? 1000 : 3000, startTime); // Brighter brassy lead
  if (isBass) {
    filter.Q.value = 1; // Less resonance for orchestral bass
  }

  // Connect to BGM Master Gain
  if (!bgmGainNode) {
    bgmGainNode = ctx.createGain();
    bgmGainNode.gain.value = 0.25; // Master BGM volume slightly higher for epic feel
    bgmGainNode.connect(ctx.destination);
  }
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(bgmGainNode);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.1); // Slight overlap for release
}

function scheduler() {
  if (!isSoundEnabled || !audioCtx) return;

  // Schedule Melody
  while (melodyNextTime < audioCtx.currentTime + SCHEDULE_AHEAD_TIME) {
    const note = SCORE_MELODY[melodyIndex % SCORE_MELODY.length];
    // Sawtooth for brassy/heroic lead
    playNote(audioCtx, note.f, 'sawtooth', melodyNextTime, note.d * SECONDS_PER_BEAT * 0.95, 0.15, false);
    melodyNextTime += note.d * SECONDS_PER_BEAT;
    melodyIndex++;
  }

  // Schedule Bass
  while (bassNextTime < audioCtx.currentTime + SCHEDULE_AHEAD_TIME) {
    const note = SCORE_BASS[bassIndex % SCORE_BASS.length];
    // Triangle for solid orchestral bass
    playNote(audioCtx, note.f, 'triangle', bassNextTime, note.d * SECONDS_PER_BEAT * 0.9, 0.3, true);
    bassNextTime += note.d * SECONDS_PER_BEAT;
    bassIndex++;
  }

  schedulerTimer = window.setTimeout(scheduler, LOOKAHEAD);
}

// Renamed to toggleSound to indicate global sound control
export const toggleSound = (enabled: boolean) => {
  const ctx = initAudio();
  isSoundEnabled = enabled;

  if (enabled) {
    if (bgmGainNode) {
      bgmGainNode.gain.cancelScheduledValues(ctx.currentTime);
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
    // Fade out BGM
    if (bgmGainNode) {
      bgmGainNode.gain.cancelScheduledValues(ctx.currentTime);
      bgmGainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    }
    if (schedulerTimer) {
      clearTimeout(schedulerTimer);
      schedulerTimer = null;
    }
  }
};

// --- Orchestral SFX Logic ---

const playOrchestralSFX = (type: 'timpani' | 'glockenspiel' | 'harp' | 'cymbal', duration: number, startTime: number = 0, vol: number = 0.5, freq: number = 440) => {
  if (!isSoundEnabled) return;

  const ctx = initAudio();
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  
  // Add a bit of reverb to SFX too
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.15;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.2;
  masterGain.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(ctx.destination);

  if (type === 'timpani') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    
    // Pitch drop
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, ctx.currentTime + startTime + 0.2);
    
    gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
    
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  } else if (type === 'glockenspiel') {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
    osc2.frequency.setValueAtTime(freq * 2.01, ctx.currentTime + startTime); // Inharmonic overtone
    
    gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(masterGain);
    osc1.start(ctx.currentTime + startTime);
    osc2.start(ctx.currentTime + startTime);
    osc1.stop(ctx.currentTime + startTime + duration);
    osc2.stop(ctx.currentTime + startTime + duration);
  } else if (type === 'harp') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3, ctx.currentTime + startTime);
    filter.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + startTime + 0.2);
    
    gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  } else if (type === 'cymbal') {
    // White noise burst
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(ctx.currentTime + startTime);
  }
};

export const playClick = () => {
  if (!isSoundEnabled) return;
  initAudio(); 
  // Light glockenspiel tap
  playOrchestralSFX('glockenspiel', 0.5, 0, 0.1, 1200);
};

export const playConfirm = () => {
  if (!isSoundEnabled) return;
  initAudio();
  // Harp arpeggio
  playOrchestralSFX('harp', 1.0, 0, 0.2, 880); // A5
  playOrchestralSFX('harp', 1.0, 0.05, 0.2, 1108.73); // C#6
  playOrchestralSFX('harp', 1.0, 0.1, 0.2, 1318.51); // E6
};

export const playDepart = () => {
  if (!isSoundEnabled) return;
  initAudio();
  // Timpani roll + Cymbal crash
  playOrchestralSFX('timpani', 0.5, 0, 0.4, 130.81); // C3
  playOrchestralSFX('timpani', 0.5, 0.1, 0.4, 130.81);
  playOrchestralSFX('timpani', 1.0, 0.2, 0.6, 196.00); // G3
  playOrchestralSFX('cymbal', 2.0, 0.2, 0.3);
};

export const playFanfare = () => {
  if (!isSoundEnabled) return;
  initAudio();
  
  // Orchestral Fanfare (Brass + Strings + Timpani)
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
  notes.forEach((freq, i) => {
    playOrchestralSFX('glockenspiel', 1.0, i * 0.15, 0.3, freq);
    playOrchestralSFX('harp', 1.0, i * 0.15, 0.3, freq / 2);
  });
  
  // Final Chord
  setTimeout(() => {
     playOrchestralSFX('cymbal', 3.0, 0, 0.4);
     playOrchestralSFX('timpani', 2.0, 0, 0.6, 130.81); // C3
  }, 600);
};

export const playGachaReveal = () => {
  if (!isSoundEnabled) return;
  initAudio();
  
  // Timpani roll build up
  for(let i=0; i<10; i++) {
      playOrchestralSFX('timpani', 0.2, i * 0.05, 0.2 + (i * 0.03), 98.00); // G2
  }
  
  setTimeout(() => {
    // Reveal (Harp glissando + Glockenspiel + Cymbal)
    const gliss = [1046.50, 1174.66, 1318.51, 1396.91, 1567.98, 1760.00, 1975.53, 2093.00];
    gliss.forEach((freq, i) => {
        playOrchestralSFX('harp', 1.0, i * 0.04, 0.2, freq);
    });
    playOrchestralSFX('glockenspiel', 2.0, 0.3, 0.4, 2093.00); // C7
    playOrchestralSFX('cymbal', 2.0, 0.3, 0.2);
  }, 500);
};

export const playError = () => {
  if (!isSoundEnabled) return;
  initAudio();
  // Low dissonant timpani
  playOrchestralSFX('timpani', 0.5, 0, 0.5, 110.00); // A2
  playOrchestralSFX('timpani', 0.5, 0, 0.5, 116.54); // Bb2 (dissonance)
};
