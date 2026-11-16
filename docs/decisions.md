# Decisions

Non-obvious choices, each with the reason in one line. Newest last within a group.

## Rendering and playback

- **Draw the cat through WebGL from a stacked colour/alpha video.** H.264 has no alpha and Safari cannot play WebM with alpha.
- **Repeat one 2-second take four times in the 8-second loop.** A browser hitches each time a video restarts, so this makes it happen four times less often.
- **Follow the video clock for the knock sound, not a timer.** A timer drifts from the picture; `mediaTime` stays exact and also covers the loop point.
- **Ship one 120 fps clip.** It is smooth on ProMotion iPhones and 120 Hz screens, and it plays fine everywhere tested except the Edge issue below.
- **Request the screen wake lock on play, on a tap/click/key and when the tab becomes visible.** Some browsers (iOS) only grant it from a user gesture, and it is released whenever the tab is hidden.

## Stall recovery

- **Keep the 0.5 s stall ladder and the repaint after resize.** They fix a lost frame callback and a cleared canvas within about half a second.
- **The remaining freezes are not fixable in the page.** On Edge for Windows with Intel Arc graphics the hardware H.264 decoder blocks for 1–4 s; turning off `edge://flags/#disable-accelerated-video-decode` removes them. Details in [architecture](architecture.md#known-issue-freezes-on-edge-for-windows).

## Tried and dropped

All of these were measured on the affected machine while it froze, and none reduced the freezes enough to keep.

- **A 60 fps fallback clip chosen by measured display refresh rate.** 10 freezes in 3 minutes against 17 for the 120 fps clip, with a longer worst case (4.2 s against 2.8 s). It also added refresh-rate detection, which Safari on iOS reports unreliably.
- **Two `<video>` elements taking turns for a seamless loop, instead of the browser's seek back to 0.** Freezes at the loop point dropped, but the total stayed the same (17 in 3.6 minutes) and moved into the middle of the clip. Not worth the extra code.
- **Lighter re-encodes of the 120 fps clip (Constrained Baseline with no deblocking, and Main with one reference frame).** 6 and 7 freezes against 11, a difference too small to tell from noise, for 1–1.5 MB more.
- **Uploading frames to WebGL as the bottleneck.** Measured at about 0.5 ms per frame, and switching it off changed nothing.
- **Leaves, drop shadows and backdrop blur as the bottleneck.** Switching each off did not change the frame rate.
