# Architecture

A static HTML/CSS/JavaScript page with no build step. Everything the browser loads is in `public/`.

## Files

- `public/index.html`: scene markup and the analytics snippet.
- `public/styles.css`: layout and responsive styles.
- `public/app.js`: audio, video playback, WebGL drawing, stall recovery, screen wake lock, fullscreen, falling leaves and the controls.
- `public/assets/`: `room.webp` (the empty room), `momo.mp4` (the cat loop), `momo-poster.webp` (its first frame as a transparent image), `mokugyo.mp3` and the support QR.
- `vercel.json`: static deployment settings, including a one-day cache for `/assets/*`. Returning visitors may keep an old asset for up to a day after it is replaced.

## Layers

The room is a full-screen background. The cat is its own layer on top, sized to the screen (at most 620 px wide, 91% of the width on portrait screens) with a CSS drop shadow that grounds it on the floor.

`momo.mp4` stacks each frame's colour on top and its alpha (as grey) below, because H.264 has no alpha channel and Safari cannot play WebM with alpha. The `<video>` is invisible. `app.js` uploads every frame to WebGL, and a small shader draws colour × alpha into a transparent `<canvas>` over the room. Until the first frame is drawn, or when WebGL is missing, the transparent poster is shown instead.

## The clip

| | |
|---|---|
| Length | 8 seconds, looping forever |
| Frame rate | 120 fps, 960 frames |
| Frame size | 688×1376 (colour 688×688 on top, alpha below) |
| Codec | H.264 High, no B-frames, a keyframe every 30 frames, no audio |
| Size | about 2.2 MB |

It is one 2-second, 3-strike take repeated four times, so there are 12 strikes per loop. Browsers hitch for a moment each time a video restarts; repeating the take makes that happen every 8 seconds instead of every 2.

## Strike and sound sync

A strike starts every `BEAT_S` = 2/3 s of video time, counted from the start of the clip, and the loop length is an exact multiple of `BEAT_S`. If you replace the video, keep both true; otherwise sound and picture drift apart.

`app.js` follows the video clock instead of its own timer. It draws on `requestVideoFrameCallback` (falling back to `requestAnimationFrame` while playing) and plays the knock whenever `Math.floor(mediaTime / BEAT_S)` changes. That also covers the loop point. The sound is scheduled ahead using the frame's expected display time minus the audio output latency, so it reaches the speaker when the frame is shown. A paused video produces no callbacks, so the sound and the strike ripple stop with it.

## Recovery

The page repairs itself in three situations.

- **Canvas cleared.** Changing the canvas size clears it, and a paused video sends no new frames, so the canvas is repainted right after every resize, DevTools toggle or pixel-ratio change (for example moving to a display with another ratio).
- **GPU reset.** On `webglcontextlost` the still poster is shown; on `webglcontextrestored` the shader, buffer and texture are rebuilt and the frame is repainted.
- **Stalled video.** If no frame arrives, the page escalates by how long the picture has been frozen: after 0.5 s it re-arms the frame callback, after 0.9 s it seeks back 50 ms, after 1.5 s it pauses and plays, and after 2.5 s it reloads the clip at the same position. A frame arriving resets the ladder. It also resumes a video the browser paused (not one the visitor paused) when the tab becomes visible, regains focus or is restored from the back/forward cache.

## Known issue: freezes on Edge for Windows

On one machine (Dell 14 Pro Max, Intel Arc 140T graphics, Edge on Windows) the cat froze for one to four seconds at random, mostly while other tabs or windows were opened and closed or the mouse crossed to another display. The page itself kept rendering at full rate; only the video frames stopped. The recovery steps above do not help here, because the decoder is blocked until it recovers on its own.

Setting `edge://flags/#disable-accelerated-video-decode` to **Disabled** (then relaunching Edge) removed the freezes, so the cause is the browser's hardware H.264 decoder or its driver, not the page. This is a workaround for the viewer, not something the page can switch on. Updating the Intel graphics driver and trying another browser were suggested but not tested. See [decisions](decisions.md) for the other fixes that were tried and did not help.
