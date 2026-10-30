# Mõ Mõ · A quiet room

A small ambient page: an orange chibi cat tapping a wooden temple block in a warm Japanese room. Designed for a full-screen TV or monitor.

## Features

- Animated paw and mallet; the cat's head and body stay still.
- Three evenly spaced strikes per two seconds (90 BPM).
- Real recorded mokugyo audio, muted until the visitor enables it.
- Pause/resume, fullscreen, and Space keyboard shortcut.
- Captions stay visible while controls fade after inactivity.
- Vercel Web Analytics integration.

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
- `public/styles.css` — layout, paw animation, responsive styles.
- `public/app.js` — audio, playback, fullscreen, and controls.
- `public/assets/` — generated WebP illustrations and recorded MP3.
- `vercel.json` — static deployment configuration.

The paw is a separate composited illustration; its pose can be refined independently in `.swing` and `@keyframes gentle-tap`. Keep the CSS animation duration and `BEAT_MS` in sync if changing the tempo.

## Assets and audio

The room, cat, and separate paw illustrations were AI-generated for this project. Images are stored as WebP, including transparency for the cat and paw.

Audio: **Mokugyo.wav** by **jonopodmore**, licensed **CC0**, downloaded as the high-quality MP3 preview. It is a real wooden fish from Kohya-san, Japan, played with its original cloth-covered beater.

Source: https://freesound.org/people/jonopodmore/sounds/607215/

The requested YouTube reference audio is **not** included; the page uses the Freesound recording above. See `public/assets/CREDITS.txt`.
