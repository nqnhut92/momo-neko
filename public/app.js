'use strict';

// assets/momo.mp4 is the cat layer: each frame stacks the colour (top half) over the alpha (bottom half).
// It loops for 8 seconds and holds 12 strikes (the same 2-second take four times, so the
// browser's loop restart hitch happens four times less often). At 60 fps the mallet lands on frames 0, 40,
// 80, ..., so a strike starts every BEAT_S seconds of video time, beginning at 0.
const BEAT_S = 2 / 3;
const BEATS_PER_LOOP = 12;
// Frame times come from the browser as rounded numbers; this keeps a strike frame that reads a hair early.
const BEAT_EPSILON_S = 0.002;
const MAX_LOOKAHEAD_S = 0.1;
const HIDE_CONTROLS_AFTER_MS = 4500;
const soundButton = document.querySelector('#sound');
const pauseButton = document.querySelector('#pause');
const fullButton = document.querySelector('#full');
const scene = document.querySelector('.scene');
const video = document.querySelector('.clip');
const canvas = document.querySelector('canvas.cat');
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
let audioContext;
let samplePromise;
let sample;
let hideTimer;
let lastBeat = -1;

async function initializeAudio() {
  audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
  await audioContext.resume();
  if (!samplePromise) {
    samplePromise = fetch('assets/mokugyo.mp3')
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

// delay (seconds) lets the sound be scheduled so it reaches the speaker when the frame is shown.
function knock(delay = 0) {
  if (muted || video.paused || !sample || document.hidden) return;
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = sample;
  gain.gain.value = 0.72;
  source.connect(gain).connect(audioContext.destination);
  source.start(audioContext.currentTime + delay);
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
    soundButton.dataset.on = String(!muted);
    setButton(soundButton, muted ? mutedIcon : soundOnIcon, muted ? 'Bật âm thanh' : 'Tắt âm thanh');
  } catch (error) {
    setButton(soundButton, mutedIcon, 'Thử bật lại tiếng');
    console.error(error);
  } finally {
    soundButton.disabled = false;
  }
});

// The button follows the video's real state, so it stays right if autoplay is blocked.
function showPaused() {
  const paused = video.paused;
  setButton(pauseButton, paused ? playIcon : pauseIcon, paused ? 'Tiếp tục' : 'Tạm dừng');
}

pauseButton.addEventListener('click', () => {
  if (video.paused) video.play().catch(showPaused);
  else video.pause();
});
video.addEventListener('play', () => {
  showPaused();
  if (!hasFrameCallback && !watching) watch();
});
video.addEventListener('pause', showPaused);

function showFullscreenHint(msg) {
  const existing = document.querySelector('.fs-hint');
  if (existing) existing.remove();
  const hint = document.createElement('div');
  hint.className = 'fs-hint';
  hint.textContent = msg;
  document.body.appendChild(hint);
  setTimeout(() => hint.classList.add('show'), 20);
  setTimeout(() => {
    hint.classList.remove('show');
    setTimeout(() => hint.remove(), 400);
  }, 4000);
}

fullButton.addEventListener('click', async () => {
  const doc = document;
  const docEl = doc.documentElement;
  const isFull = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
  try {
    if (isFull) {
      if (doc.exitFullscreen) await doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    } else {
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else {
        showFullscreenHint('iPhone cần chọn Chia sẻ → Thêm vào MH chính để xem tràn viền 🍁');
      }
    }
  } catch (error) {
    console.warn('Fullscreen is unavailable in this browser.', error);
    showFullscreenHint('Trình duyệt không cho phép toàn màn hình lúc này.');
  }
});

// Esc can also leave fullscreen, so follow the browser's state rather than our own clicks.
['fullscreenchange', 'webkitfullscreenchange'].forEach(evt => {
  document.addEventListener(evt, () => {
    const full = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    setButton(fullButton, full ? exitFullIcon : enterFullIcon, full ? 'Thoát toàn màn hình' : 'Toàn màn hình');
  });
});

setButton(soundButton, mutedIcon, 'Bật âm thanh');
setButton(fullButton, enterFullIcon, 'Toàn màn hình');

// Draw the cat: colour from the top half of the video frame, alpha from the bottom half.
const drawFrame = (() => {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false })
    || canvas.getContext('experimental-webgl');
  if (!gl) return () => {};

  function resizeViewport() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const targetW = Math.round(rect.width * dpr);
    const targetH = Math.round(rect.height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      gl.viewport(0, 0, targetW, targetH);
    }
  }
  window.addEventListener('resize', resizeViewport);

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER,
    'attribute vec2 p; varying vec2 uv;' +
    'void main() { uv = vec2(p.x + 1.0, 1.0 - p.y) * 0.5; gl_Position = vec4(p, 0.0, 1.0); }'));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER,
    'precision mediump float; varying vec2 uv; uniform sampler2D frame;' +
    'void main() {' +
    '  vec3 colour = texture2D(frame, vec2(uv.x, uv.y * 0.5)).rgb;' +
    '  float alpha = texture2D(frame, vec2(uv.x, 0.5 + uv.y * 0.5)).g;' +
    '  gl_FragColor = vec4(colour * alpha, alpha);' +
    '}'));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return () => {};
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return () => {
    if (video.readyState < 2) return;
    resizeViewport();
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
    } catch (error) {
      return;
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    scene.classList.add('drawn');
  };
})();
video.addEventListener('loadeddata', () => drawFrame());
video.addEventListener('seeked', () => drawFrame());

// Follow the video clock so sound and picture stay together, including at the loop point.
// requestVideoFrameCallback fires once per displayed video frame and not at all while paused;
// browsers without it fall back to requestAnimationFrame, which runs only while the video plays.
const hasFrameCallback = 'requestVideoFrameCallback' in video;
let watching = false;

function audioLatency() {
  return audioContext ? audioContext.outputLatency || audioContext.baseLatency || 0 : 0;
}

function spawnMokugyoRipple() {
  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  scene.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

function onVideoFrame(now, frame) {
  drawFrame();
  const time = frame ? frame.mediaTime : video.currentTime;
  // Modulo keeps the loop point from counting twice when the clock reads just under the 2 s end.
  const beat = Math.floor((time + BEAT_EPSILON_S) / BEAT_S) % BEATS_PER_LOOP;
  if (beat !== lastBeat) {
    const untilShown = frame ? (frame.expectedDisplayTime - performance.now()) / 1000 : 0;
    const delay = Math.min(MAX_LOOKAHEAD_S, Math.max(0, untilShown - audioLatency()));
    knock(delay);
    setTimeout(spawnMokugyoRipple, Math.max(0, (untilShown || 0) * 1000));
  }
  lastBeat = beat;
  watch();
}

function watch() {
  if (hasFrameCallback) {
    video.requestVideoFrameCallback(onVideoFrame);
  } else if (video.paused) {
    watching = false;
  } else {
    watching = true;
    requestAnimationFrame(onVideoFrame);
  }
}
watch();

// Respect "reduce motion": start on the still cat; the pause button starts it.
if (matchMedia('(prefers-reduced-motion: reduce)').matches) video.pause();
else video.play().catch(showPaused);
showPaused();

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

// Falling autumn leaves (Momiji)
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const leavesContainer = document.createElement('div');
  leavesContainer.className = 'leaves';
  leavesContainer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(leavesContainer);

  const leafSvg = color => `
    <svg viewBox="0 0 24 24" width="100%" height="100%" style="display:block">
      <path fill="${color}" d="M12 2c.2 2.8-.5 4.8-1.8 6.5-1.8-1.5-3.5-2.2-5.8-2.5.8 2.5 1.2 4.5.8 6.8-2.2-.8-4.2-1-6.2-.8 1.8 1.8 3.2 3.5 4.2 5.5-2 .5-3.8 1.5-5.2 2.8 2.2.8 4.2.8 6.2.2-.2 2.2 0 4.2.8 6.2 1.5-1.8 2.8-3.5 3.5-5.5 1.5 1.8 3 3.2 5 4.2-.2-2.2 0-4.2.8-6.2 2 .5 4 .5 6.2-.2-1.5-1.2-3.2-2.2-5.2-2.8 1-2 2.5-3.8 4.2-5.5-2-.2-4 0-6.2.8-.5-2.2 0-4.2.8-6.8-2.2.2-4 1-5.8 2.5-1.2-1.8-2-3.8-1.8-6.5z"/>
      <path stroke="#631405" stroke-width="0.8" fill="none" opacity="0.65" d="M12 22V8m0 4l-4-3m4 5l4-3m-4 5l-3-1m3 2l3-1"/>
    </svg>`;

  const leafColors = ['#b52a18', '#cc3b1e', '#e05828', '#f27e33', '#d4431f', '#9e1c0d'];
  const NUM_LEAVES = 10;

  for (let i = 0; i < NUM_LEAVES; i++) {
    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    const color = leafColors[i % leafColors.length];
    leaf.innerHTML = leafSvg(color);

    // Gió thu bứt lá từ tán cây phong đỏ ngoài vườn (x: 74vw..98vw, y: 10vh..36vh).
    // Tuyệt đối không spawn từ trên mép trần nhà (y <= 8vh) để người nhìn thấy rõ lá bứt ra từ tán cây.
    const startX = (74 + (i % 5) * 5.2 + (Math.random() * 4 - 2)).toFixed(1);
    const startY = (11 + Math.random() * 25).toFixed(1);
    const driftX = (-(42 + Math.random() * 24)).toFixed(1);
    const driftY = (56 + Math.random() * 24).toFixed(1);
    const scaleStart = (0.48 + Math.random() * 0.16).toFixed(2);
    const scaleEnd = (0.95 + Math.random() * 0.30).toFixed(2);
    const fallDur = (11 + Math.random() * 5.5).toFixed(1);
    const swayDur = (2.2 + Math.random() * 1.5).toFixed(1);
    const fallDelay = (-Math.random() * fallDur).toFixed(1);
    const swayDelay = (-Math.random() * swayDur).toFixed(1);

    leaf.style.setProperty('--start-x', `${startX}vw`);
    leaf.style.setProperty('--start-y', `${startY}vh`);
    leaf.style.setProperty('--drift-x', `${driftX}vw`);
    leaf.style.setProperty('--drift-y', `${driftY}vh`);
    leaf.style.setProperty('--scale-start', scaleStart);
    leaf.style.setProperty('--scale-end', scaleEnd);
    leaf.style.setProperty('--fall-dur', `${fallDur}s`);
    leaf.style.setProperty('--fall-delay', `${fallDelay}s`);

    const svg = leaf.querySelector('svg');
    if (svg) {
      svg.style.setProperty('--sway-dur', `${swayDur}s`);
      svg.style.setProperty('--sway-delay', `${swayDelay}s`);
    }

    leavesContainer.appendChild(leaf);
  }
}
