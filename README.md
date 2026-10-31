# Mõ Mõ · A quiet room

A small ambient page: an orange chibi cat tapping a wooden temple block in a warm Japanese room. Designed for a full-screen TV or monitor.

## Features

- Two-pose mallet strike: mallet raised, then on the drum. Only the arm area swaps, so the cat's body never flickers.
- Three evenly spaced strikes per two seconds (90 BPM), with the knock sound on the moment of contact.
- Real recorded mokugyo audio, muted until the visitor enables it.
- Icon-only controls for sound, pause/resume, the GitHub source and fullscreen, with tooltips; Space toggles pause.
- Controls fade after inactivity; the caption stays visible.
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
- `public/styles.css` — layout, strike animation, responsive styles.
- `public/app.js` — audio, playback, fullscreen and the icon controls.
- `public/assets/` — WebP illustrations and the recorded MP3.
- `vercel.json` — static deployment configuration.

## How the strike works

The cat is three stacked layers of the same size:

- `chibi-body.webp` — the whole cat with the arm area cut out. It never changes.
- `chibi-arm-up.webp` — the arm area with the mallet raised (`.swing`).
- `chibi-arm-down.webp` — the arm area with the mallet on the drum (`.down`).

`@keyframes arm-up` and `arm-down` swap the two arm layers with a hard cut (`step-end`) at 48% of each beat. `app.js` reads the clock of the `.swing` animation and plays the knock when it crosses `CONTACT_PHASE`, so sound and picture stay together, including while paused. If you change the tempo, keep the CSS duration (`calc(2000ms / 3)`) and `BEAT_MS` in sync, and keep `CONTACT_PHASE` equal to the keyframe where the mallet lands.

## Assets and audio

The room and cat illustrations were AI-generated for this project. The cat was rendered on a white background and cut out to WebP with transparency, keeping the real gaps between the arms, legs and tail.

Audio: **Mokugyo.wav** by **jonopodmore**, licensed **CC0**, downloaded as the high-quality MP3 preview. It is a real wooden fish from Kohya-san, Japan, played with its original cloth-covered beater.

Source: https://freesound.org/people/jonopodmore/sounds/607215/ (see `public/assets/CREDITS.txt`).

## License

Code and illustrations are released under the [MIT License](LICENSE). The audio file `public/assets/mokugyo.mp3` is not covered by it: it is jonopodmore's recording, published under CC0 (see above).
