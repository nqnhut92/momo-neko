'use strict';

// Three evenly spaced strikes every two seconds. Keep CSS duration in sync.
const BEAT_MS = 2000 / 3;
const CONTACT_PHASE = 0.48;
const HIDE_CONTROLS_AFTER_MS = 4500;
const soundButton = document.querySelector('#sound');
const pauseButton = document.querySelector('#pause');
const fullButton = document.querySelector('#full');
const room = document.querySelector('.room');
const arm = document.querySelector('.swing');
const icon = body => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">${body}</svg>`;
const stroke = d => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
const speaker = '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>';
const mutedIcon = icon(speaker + stroke('M16 9.5l5 5M21 9.5l-5 5'));
const soundOnIcon = icon(speaker + stroke('M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12'));
const pauseIcon = icon('<rect x="5" y="4" width="5" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="5" height="16" rx="1" fill="currentColor"/>');
const playIcon = icon('<path d="M7 4L20 12L7 20Z" fill="currentColor"/>');
const enterFullIcon = icon(stroke('M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5'));
const exitFullIcon = icon(stroke('M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5'));

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

// Buttons are icon-only: the name goes to screen readers (aria-label) and the hover tooltip (title).
function setButton(button, svg, name) {
  button.innerHTML = svg;
  button.setAttribute('aria-label', name);
  button.title = name;
}

soundButton.addEventListener('click', async () => {
  soundButton.disabled = true;
  try {
    await initializeAudio();
    muted = !muted;
    soundButton.setAttribute('aria-pressed', String(!muted));
    setButton(soundButton, muted ? mutedIcon : soundOnIcon, muted ? 'Bật âm thanh' : 'Tắt âm thanh');
  } catch (error) {
    setButton(soundButton, mutedIcon, 'Thử bật lại tiếng');
    console.error(error);
  } finally {
    soundButton.disabled = false;
  }
});

pauseButton.addEventListener('click', () => {
  paused = !paused;
  room.classList.toggle('paused', paused);
  pauseButton.setAttribute('aria-pressed', String(paused));
  setButton(pauseButton, paused ? playIcon : pauseIcon, paused ? 'Tiếp tục' : 'Tạm dừng');
});

fullButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen?.();
  } catch (error) {
    console.warn('Fullscreen is unavailable in this browser.', error);
  }
});

// Esc can also leave fullscreen, so follow the browser's state rather than our own clicks.
document.addEventListener('fullscreenchange', () => {
  const full = Boolean(document.fullscreenElement);
  setButton(fullButton, full ? exitFullIcon : enterFullIcon, full ? 'Thoát toàn màn hình' : 'Toàn màn hình');
});

setButton(soundButton, mutedIcon, 'Bật âm thanh');
setButton(pauseButton, pauseIcon, 'Tạm dừng');
setButton(fullButton, enterFullIcon, 'Toàn màn hình');

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
