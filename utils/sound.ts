
// Simple Web Audio API wrapper for sound effects without external files

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

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
  const now = ctx.currentTime;
  
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
  // Mystical upward sweep
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
  
  // Sparkles
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
