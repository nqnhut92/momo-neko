'use strict';

// Three evenly spaced strikes every two seconds. Keep CSS duration in sync.
const BEAT_MS = 2000 / 3;
const CONTACT_PHASE = 0.48;
const HIDE_CONTROLS_AFTER_MS = 4500;
const soundButton = document.querySelector('#sound');
const pauseButton = document.querySelector('#pause');
const room = document.querySelector('.room');
const arm = document.querySelector('.swing');
const pauseIcon = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="5" height="16" rx="1" fill="currentColor"/></svg>';
const playIcon = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M7 4L20 12L7 20Z" fill="currentColor"/></svg>';

let muted = true;
let paused = false;
let audioContext;
let samplePromise;
let sample;
let hideTimer;
let lastPhase = 0;

async function initializeAudio() {
  audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
  await audioContext.resume();
  if (!samplePromise) {
    samplePromise = fetch('/assets/mokugyo.mp3')
      .then(response => {
        if (!response.ok) throw new Error(`Audio request failed: ${response.status}`);
        return response.arrayBuffer();
      })
      .then(bytes => audioContext.decodeAudioData(bytes))
      .catch(error => {
        samplePromise = undefined;
        throw error;
      });
  }
  sample = await samplePromise;
}

function knock() {
  if (muted || paused || !sample || document.hidden) return;
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = sample;
  gain.gain.value = 0.72;
  source.connect(gain).connect(audioContext.destination);
  source.start();
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
  };
}

soundButton.addEventListener('click', async () => {
  soundButton.disabled = true;
  try {
    await initializeAudio();
    muted = !muted;
    soundButton.setAttribute('aria-pressed', String(!muted));
    soundButton.textContent = muted ? '♫ Âm thanh' : '♫ Đang bật';
  } catch (error) {
    soundButton.textContent = 'Thử bật lại tiếng';
    console.error(error);
  } finally {
    soundButton.disabled = false;
  }
});

pauseButton.addEventListener('click', () => {
  paused = !paused;
  room.classList.toggle('paused', paused);
  pauseButton.innerHTML = paused ? playIcon : pauseIcon;
  pauseButton.setAttribute('aria-pressed', String(paused));
  pauseButton.setAttribute('aria-label', paused ? 'Tiếp tục' : 'Tạm dừng');
});

document.querySelector('#full').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen?.();
  } catch (error) {
    console.warn('Fullscreen is unavailable in this browser.', error);
  }
});

// Read the arm animation clock so sound and movement also pause together.
function tick() {
  const animation = arm.getAnimations()[0];
  const phase = animation ? (animation.currentTime % BEAT_MS) / BEAT_MS : 0;
  if (phase >= CONTACT_PHASE && lastPhase < CONTACT_PHASE) knock();
  lastPhase = phase;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// Captions stay visible; only the controls fade after inactivity.
function wakeControls() {
  document.body.classList.remove('hidden');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    document.body.classList.add('hidden');
  }, HIDE_CONTROLS_AFTER_MS);
}

document.addEventListener('pointermove', wakeControls);
document.addEventListener('pointerdown', wakeControls);
document.addEventListener('focusin', wakeControls);
document.addEventListener('keydown', event => {
  wakeControls();
  if (event.code === 'Space' && event.target === document.body) {
    event.preventDefault();
    pauseButton.click();
  }
});
wakeControls();
