# Demo video

The demo is rendered from source, not edited by hand. Every UI frame is a real
recording of the app, and the Base Sepolia transaction shown is the live one.

## Why it is built this way

A screen recording alone cannot show what Sibyl persists between sessions, which
is exactly the claim the video has to make. So the recorded UI shots are
intercut with illustrated scenes that draw the memory path: two agents wired to
one database, the runtimes dissolving while the records survive, and a
persist-recall-decide breakdown.

## Rebuild it

Recording needs the app running and a Chrome with remote debugging open.

```bash
# 1. serve the app with the deployed registry configured
BASE_RECEIPT_CONTRACT=0x980ea2442f51f39f7d0b257ec8c3449e630434f4 \
  .venv/bin/python -m groundhog_vault.server --port 4190

# 2. headless Chrome for capture
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --remote-debugging-port=9227 --window-size=1920,1080 \
  --user-data-dir=/tmp/groundhog-chrome about:blank

# 3. record every shot plus the explorer screenshot
CDP_ORIGIN=http://127.0.0.1:9227 APP_URL=http://127.0.0.1:4190 \
  FRAME_DIR=/tmp/frames node ../scripts/demo-driver.mjs

# 4. encode the frame sequences into video/public/shot_*.mp4, then render
npx remotion render src/index.ts MainVideo out/demo.mp4 --concurrency 6
```

## Narration

`../demo/narration.txt` holds the script, one block per scene with its length.
Audio files live at `public/vo_<scene>.wav` and are gitignored. Scene durations
in `src/constants.ts` are derived from those files, so replacing the narration
means updating both.

## Gotchas

**Render shows a blank or unstyled frame**
Fonts must load through `@remotion/google-fonts`. A CDN link renders before the
font arrives and the frame captures empty.

**A scene ends before its narration does**
`src/constants.ts` `SCENES` and the `public/vo_*.wav` lengths have drifted apart.
Re-measure with ffprobe and update the constants.

**A UI clip freezes early**
The recorded shot is shorter than its scene. Re-encode it with a longer
`tpad=stop_duration` so the last frame holds for the whole scene.
