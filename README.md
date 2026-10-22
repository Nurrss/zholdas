# Zholdas — AI friend for drivers

Project **ChistoPro**, team **AGATRIO**.

Zholdas watches the driver with the front camera. If the driver sleeps, looks at the phone, looks to the side or yawns, Zholdas talks and wakes them up. All face detection works on the phone. The video never leaves the phone.

Zholdas can also **listen to the engine** (15 seconds with the microphone) and tell you if the sound changed since last time.

There is also a **dispatcher page** for a fleet: `/dispatch/` (demo data).

## Run on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Open the link that you see in the terminal (for example `http://localhost:5173`).

To build the final version:

```bash
npm run build      # result is in the dist/ folder
npm run preview    # open the built version
```

## Demo mode (for the pitch)

- **Long press on the trip time** ("в пути", bottom left) → the demo panel opens.
- Buttons: "Тест: сон", "Тест: телефон", "Тест: взгляд в сторону", "Тест: зевок", "2 часа за рулём", "Тест: мотор ОК", "Тест: мотор проблема".
- They work without a camera and without a microphone.
- **Tap the avatar** → Zholdas talks. There you also find "Пауза 10 мин", "Завершить" (end the trip) and "Проверить машину".
- Dispatcher page: open `/dispatch/` (for example `https://<your-name>.github.io/zholdas/dispatch/`).

## Change the avatar images

Put your images in `public/avatar/`:

| File           | Where                                        |
| -------------- | -------------------------------------------- |
| `calm.png`     | start screen, trip summary                   |
| `watching.png` | small avatar while driving, phone warning    |
| `alert.png`    | alarm "Эй, не спи!"                          |
| `talk.png`     | Zholdas talks                                |
| `listen.png`   | diagnostics: listening to the engine         |
| `ok.png`       | diagnostics: everything is OK                |
| `problem.png`  | diagnostics: there is a problem              |

Square PNG (for example 540×540). The app always shows them in a circle.
If a file is missing, the app shows a teal placeholder.

## Change the numbers

All numbers are in **`src/config.ts`**. For example:

- `eyeClosedAlarmSec: 2.0` — eyes closed this long → alarm
- `eyeClosedThreshold: 0.55` — how closed the eyes must be (0 = open, 1 = closed)
- `headDownWarnSec: 3.0` — looking down this long → phone warning
- `sideYawDeg: 30`, `sideSec: 3.0` — head turned more than 30° for 3 s → "look at the road" (short mirror checks are ignored)
- `yawnMinSec: 1.2` — mouth open this long → yawn
- `demoSpeedMultiplier: 1` — make the car move faster on the map

- `diagSec: 15` — how long Zholdas listens to the engine
- `engineSimilarityOk: 0.9`, `knocksForProblem: 3` — when the engine sound counts as "changed"

All phrases (what Zholdas says) are in **`src/lib/phrases.ts`**.

## Car diagnostics

- **Sound (real):** the first check saves the engine sound as "normal" (in this browser only). The next checks compare with it. Nothing is sent anywhere.
- To start again from zero, clear the site data in the browser.
- **OBD (demo):** temperature, battery and error codes are fake for now (`src/lib/obd.ts`). A real adapter can be added later behind the same `ObdAdapter` interface. Error code texts: `src/lib/obdCodes.ts`.
- It is a hint, not a diagnosis. Only a mechanic can say for sure.

## Deploy to GitHub Pages (free)

The camera on a phone works only with **HTTPS**. GitHub Pages gives you HTTPS.

Live app: **https://nurrss.github.io/zholdas/** · Dispatcher: **https://nurrss.github.io/zholdas/dispatch/**

**To deploy a new version** (after you change something):

```bash
git add -A
git commit -m "What I changed"
git push            # saves the code on GitHub
npm run deploy      # builds and publishes the site (branch gh-pages)
```

Wait about 1 minute, then reload the site. On the phone, close and open the app twice
(the service worker loads the new version in the background).

### Later: automatic deploy on every push (optional)

The file `.github/workflows/deploy.yml` can deploy automatically on every `git push`.
To push this file, GitHub needs the `workflow` permission:

1. Run `gh auth refresh -h github.com -s workflow` and confirm in the browser.
2. Remove the `.github/` line from `.gitignore`, then `git add .github && git commit -m "Add deploy workflow" && git push`.
3. On GitHub: **Settings → Pages → Source → GitHub Actions**.

## Backup way: Netlify Drop

1. Run `npm run build`.
2. Open [app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag the **`dist`** folder onto the page.
4. You get an HTTPS link in a few seconds.

## Install on the phone

Open the link in **Chrome on Android** → menu **⋮** → **Add to Home screen**.
The app opens in full screen. After the first open, the app and the face model work without internet. The map needs internet (map pieces you already saw are saved).

## Tech

Vite, React, TypeScript, Tailwind CSS, MapLibre GL (OpenFreeMap tiles), MediaPipe Face Landmarker, Framer Motion, Web Speech API, Web Audio API, Screen Wake Lock API, vite-plugin-pwa.
