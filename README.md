# Mõ Mõ · A quiet room

A small ambient page: an orange chibi cat tapping a wooden temple block in a warm Japanese room. Designed for a full-screen TV or monitor.

## Features

- Two layers: the empty room as a full-screen background, and the cat as a transparent looping video on top, sized to the screen (at most 620 px wide, 91% of the width on portrait screens). The mallet strikes evenly: three every two seconds (90 BPM).
- The knock sound is triggered from the video clock, on the frame where the mallet lands, and scheduled to cover the display and audio output latency.
- Real recorded mokugyo audio, muted until the visitor enables it.
- Icon-only controls for sound, pause/resume, the GitHub source and fullscreen, with tooltips; Space toggles pause.
- Controls fade after inactivity; the caption stays visible. With "reduce motion" enabled the page starts on the still cat.
- Text and controls scale with the screen width, from phones up to 2K/4K displays. On portrait screens the control row turns 90° counter-clockwise into a column, with fullscreen on top.
- Vercel Web Analytics integration.
- An orange-cat favicon in SVG, ICO and PNG formats, plus a 180px Apple touch icon.

## Deploy on Vercel

1. In Vercel, select **Add New → Project** and import `nqnhut92/momo-neko`.
2. Keep **Root Directory** at the repository root. `vercel.json` configures **Other**, no build command, and **Output Directory: public**.
3. Deploy. No environment variables or package installation are needed.
4. Open the Vercel project's **Analytics** tab and click **Enable**.
5. Redeploy once after enabling Analytics, then visit the production URL to generate a page view.

The tracking snippet is already in `public/index.html`. Analytics requires the Vercel dashboard setting; adding the script alone does not enable collection. The `/_vercel/insights/script.js` route is provided by Vercel and is expected to return 404 during a plain local preview.

Official setup: https://vercel.com/docs/analytics/quickstart

## Local preview

```sh
python3 -m http.server 8000 --directory public
```

Open http://localhost:8000. This is a static HTML/CSS/JavaScript project with no build dependencies.

## Files

- `public/index.html` — scene markup and analytics snippet.
- `public/styles.css` — layout and responsive styles.
- `public/app.js` — audio, video playback, fullscreen and the icon controls.
- `public/assets/` — `room.webp` (the empty room), `momo.mp4` (the cat loop, colour and alpha stacked), `momo-poster.webp` (its first frame as a transparent image) and the recorded MP3.
- `vercel.json` — static deployment configuration, including a one-day cache for `/assets/*`. Returning visitors may keep an old asset for up to a day after it is replaced.

## How the strike works

`assets/momo.mp4` is 8 seconds long at 60 fps (480 frames, no audio, about 420 KB) and loops forever. Each frame is 688×1376: the cat's colour on top and its alpha (as grey) below, because H.264 has no alpha channel and Safari cannot play WebM with alpha. The video itself is invisible; `app.js` uploads every frame to WebGL and draws colour × alpha into a transparent canvas over the room. Until the first frame is drawn, or without WebGL, the transparent poster is shown instead. It is one 2-second, 3-strike loop repeated four times: browsers hitch for a moment each time a video restarts, and this way that happens every 8 seconds instead of every 2. The mallet lands on frames 0, 40, 80, ... so a strike starts every 40 frames = 2/3 s. 60 fps divides evenly into 60 Hz and 120 Hz screens, so frames are shown for an even time. `app.js` follows the video clock and draws on it (`requestVideoFrameCallback`, falling back to `requestAnimationFrame` while playing) and plays the knock whenever `Math.floor(mediaTime / BEAT_S)` changes, which also covers the loop point. A paused video produces no callbacks, so the sound and the loop stop with it.

If you replace the video, keep the strikes on exact multiples of `BEAT_S` from the start of the clip and keep the loop length an exact multiple of `BEAT_S`; otherwise sound and picture drift apart.

## Assets and audio

The room and cat illustration was AI-generated for this project. The page shows the empty room (`room.webp`) with the cat from the original picture on top; only the arm and mallet are animated, by Google Veo:

- **Still picture:** the cat and the cushion are cut out of the original image (the difference from the empty room, hysteresis threshold, largest blob, holes filled) and are the same pixels in every frame. The cut-out is pulled in 2 px and feathered, which also drops a thin grey line that the original picture has around the tail. Nothing outside the moving arm is re-rendered by the video model, so it stays sharp and perfectly still. A CSS drop shadow grounds the cat on the floor. (Veo redraws whole scenes softly and shimmers when asked for a busy background, which is why it is not used for them.)
- **Animation source:** a Veo clip of the same cat on a flat blue screen. The start image was made by subtracting the empty room (`room.webp`) from the original picture and putting the cat on pure blue; Veo 3.1 (Fast, 1280×720, 24 fps, 8 s) was asked to start and end on it (first frame = last frame), to keep the head, face and body still with the mouth closed, and to move only the arm and mallet in small taps. The cat in the clip stays within about half a pixel of the original, so the clip is aligned to the picture with a single translation of under 1 px (ECC correlation 0.998 on the cat's body).
- **Moving region:** one fixed region, the same in every frame, covering everywhere the paw, handle and mallet go (the convex hull of all pixels that differ from the picture in any used frame, about 14% of the cat layer, and widened near the arm so the thin end of the handle below the paw is included too). Inside it every frame comes entirely from the clip; a mask that changed per frame made the paw come from the still while the mallet came from the clip, which looked like a video layer sliding over a still one. The blue is keyed out (blue-dominance matte, choked, pulled in 1 px) and the colour of every edge pixel is taken from at least 2 px inside the arm, so no blue spill or dark fringe is left; blue is also capped below green/red there because the picture has no blue-dominant pixels. Where the arm leaves the cat's silhouette the layer is simply transparent, so the room shows through. Thin silhouette jitter is filtered out by morphological opening, otherwise a fringe appears around the whole cat. The video's colours are matched to the picture with a per-channel gain and offset.
- **Timing:** Veo's strikes came out at about 120 BPM (one every 12 source frames, ±8%). The moments where the mallet reaches the wooden fish were measured (the first frame where the mallet and fish area matches the contact pose), and the clip was retimed with a piecewise time warp (by picking source frames) so those moments land exactly on every 2/3 s, i.e. 90 BPM. Slowing the clip needs in-between frames; motion interpolation tore the mallet apart, so each output frame is simply the nearest source frame (slowed down 1.33×, every source frame is held for about 3 output frames at 60 fps). The 3-strike window with the best seam (source frames 60–96, well before the clip's last second, where the mouth starts to change) was repeated four times.

Audio: **Mokugyo.wav** by **jonopodmore**, licensed **CC0**, downloaded as the high-quality MP3 preview. It is a real wooden fish from Kohya-san, Japan, played with its original cloth-covered beater.

Source: https://freesound.org/people/jonopodmore/sounds/607215/ (see `public/assets/CREDITS.txt`).

## License

Code and illustrations are released under the [MIT License](LICENSE). The audio file `public/assets/mokugyo.mp3` is not covered by it: it is jonopodmore's recording, published under CC0 (see above).
