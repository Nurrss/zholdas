# Prompt for Claude Code — "Zholdas" web app

Copy everything below the line into Claude Code.

---

Hi! Please build a mobile web app for me. I am a student and this is for a pitch at a hackathon in Kazakhstan. Please explain what you do in simple English (B1 level), short sentences. Work step by step. After each step, stop, tell me how to check it, and wait for my "ok".

## 1. What is the app

The app is called **"Zholdas"** (Kazakh word: "travel friend"). Project name: **ChistoPro**, team **AGATRIO**.

Zholdas is an AI friend for drivers. The phone stands on the car dashboard. The front camera looks at the driver. A big map is on the full screen, and a cute avatar "Zholdas" sits in the corner of the map.

- If the driver **closes eyes for 2 seconds** → alarm: loud beep + voice "Эй, не спи! Открой глаза и остановись отдохнуть."
- If the driver **looks down (at the phone) for 3 seconds** → warning: "Не смотри в телефон. Смотри на дорогу."
- If the driver **yawns** → "Зеваешь? Давай поговорим." After 2 yawns → "Давай найдём заправку и сделаем остановку?"
- The video never leaves the phone. All face detection works on the device.

It must look like a real, polished app, not like a website. It must work well on stage: the phone is on a holder, I close my eyes, and Zholdas wakes me up.

## 2. Tech (please use this)

- **Vite + React + TypeScript**, styles with **Tailwind CSS**.
- **PWA** (vite-plugin-pwa): icon, full screen (`display: standalone`), dark theme color, works after "Add to Home screen".
- **Map:** MapLibre GL JS with free tiles that need **no API key** (for example OpenFreeMap). Use a **dark map style** if possible. Please check that the style URL really works.
- **Face detection:** MediaPipe Tasks Vision `FaceLandmarker` (pin an exact version), `runningMode: "VIDEO"`, `outputFaceBlendshapes: true`, `numFaces: 1`.
  - **Download the model file (`face_landmarker.task`) and the WASM files into the project (`public/`)**, so the app does not depend on Google servers during the pitch.
- **Voice:** Web Speech API (`speechSynthesis`), language `ru-RU`. Beep with Web Audio API. Also `navigator.vibrate` on alarm.
- **Screen Wake Lock API**, so the screen does not turn off.
- No backend, no database, no login. Everything is in the browser.

## 3. Detection rules (I already tested these in a simple demo)

- Eyes closed: blendshapes `eyeBlinkLeft` > 0.55 **and** `eyeBlinkRight` > 0.55. Alarm if closed ≥ **2.0 s**. Normal blinks (< 0.4 s) are ignored.
- Yawn: `jawOpen` > 0.55 for ≥ **1.2 s**.
- Head down: first **3 seconds** = calibration (driver looks straight). Use landmarks: nose tip `1`, eye corners `33` and `263`, chin `152`. `ratio = dist(nose, midEye) / dist(midEye, chin)`. Head down if `ratio > baseline × 1.18` for ≥ **3.0 s**.
- No face for 3 s → "Я тебя не вижу."
- Do not repeat the same phrase more often than every 4 seconds. During alarm, repeat until the eyes open.
- Put all numbers in one `config.ts` file, so I can change them easily.

## 4. Avatar

I will put my avatar images in `public/avatar/`:
`calm.png`, `alert.png` (alarm), `talk.png`, `sleep.png` (paused). They have transparent background.
Until I add them, please make a simple placeholder (teal circle with eyes).

Make the avatar feel **alive** with animation (CSS or Framer Motion):
- calm: slow "breathing" (scale 1 → 1.03), small floating up and down;
- talking: small bounce while the voice speaks;
- warning: orange glow ring;
- alarm: avatar becomes big in the center, shakes, red pulsing glow, red border around the whole screen;
- green dot = "I am watching", grey dot = paused.

The avatar sits in a **round bubble (about 88 px) in the bottom-right corner**. The user can **drag** it to another corner. Tap on avatar → small panel: trip time, "Пауза 10 минут", "Поговорить", "Завершить поездку".

## 5. Screens

1. **Start screen** — big avatar, text "Сәлем! Я Жолдас. Буду следить, чтобы ты не уснул.", big button **"Поехали"**. Button asks for camera permission. Short note: "Видео не сохраняется и никуда не отправляется."
2. **Drive screen (main)** — full-screen dark map, route **Taraz → Almaty**. On top: navigation card ("Через 800 м поворот направо"). On bottom: thin bar with trip time and speed. Avatar in the corner. Small camera preview (hidden by default, show with a button — useful on stage so people see my face).
3. **Alarm overlay** — red, very big text "Эй, не спи!", buttons "Я в порядке" and "Найти остановку".
4. **Warning overlay** — orange, "Смотри на дорогу".
5. **Trip summary** — trip time, number of alarms, yawns, phone warnings, advice "Отдыхай каждые 2 часа".

Design: font **Rubik**. Colors: navy `#0F2236`, teal `#1B9AAA` and `#5FC7D4`, light background `#E6EEF0`, orange `#F08A3C` (warning), red `#E5484D` (alarm), green `#3FB97F` (ok). Big text and big buttons — the driver must understand with a short look. Interface language: Russian (greeting in Kazakh is ok).

## 6. Demo mode (very important for the pitch)

- **Fake drive:** a car marker moves along the route Taraz → Almaty, speed about 90 km/h, map follows the car. Use a fixed list of route points saved in the project (no routing API needed).
- **Hidden test buttons** (open with a long press on the trip time): "Тест: сон", "Тест: телефон", "Тест: зевок". If the camera does not work on stage, I can still show everything.
- The phrase "Ты уже 2 часа за рулём. Через 12 км заправка — остановимся?" can be played from the test panel too.

## 7. Deploy (free and easy)

The camera works on a phone only with **HTTPS**. Please:
1. Set up **GitHub Pages** with a GitHub Actions workflow that builds and deploys on every push to `main`. Set the correct `base` path in Vite.
2. Tell me exactly, step by step, what I must click on GitHub (create repo, enable Pages → "GitHub Actions").
3. Give me the final link format, like `https://<my-name>.github.io/zholdas/`.
4. Also tell me the backup way: Netlify Drop (drag the `dist` folder to the site).

## 8. Quality checklist (check before you say "done")

- `npm run build` works with no errors.
- Works in Chrome on Android, portrait mode. Also test layout in desktop Chrome with phone size.
- First load is fast; model files are cached by the service worker.
- If the camera is denied → friendly message and "Попробовать снова" button.
- No console errors.
- A short `README.md` in simple English: how to run, how to change avatar images, how to change numbers in `config.ts`, how to deploy.

## Steps

1. Project setup + start screen + map with fake drive.
2. Camera + face detection + voice + overlays.
3. Avatar animations + drag + panel.
4. Trip summary + test panel.
5. PWA + deploy to GitHub Pages.

Start with step 1. Thank you!
