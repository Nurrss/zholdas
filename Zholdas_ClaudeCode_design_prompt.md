# Add-on prompt for Claude Code — make the app look like the design (+ car diagnostics)

1. Unzip `zholdas-design.zip` into your project folder (next to `package.json`).
2. Paste the text below the line into Claude Code.

---

I have a finished design for the app. It is in the folder `zholdas-design/`:

- `screenshots/` — PNG pictures of every screen. **This is how the app must look.**
- `screens/` — the same screens as simple HTML files with inline styles. Use them to copy exact colors, sizes, spacing, border radius and texts.
- `avatar/` — the real avatar images:
  `calm.png`, `watching.png`, `alert.png`, `talk.png`, `listen.png`, `ok.png`, `problem.png`.

Screens:
- `Main` — start screen
- `Drive` — main screen with the map
- `Alarm` — "Эй, не спи!"
- `Phone` — "Смотри на дорогу"
- `Talk` — Zholdas talks
- `Summary` — trip summary
- `DiagListen` — car diagnostics: Zholdas listens to the engine
- `DiagOk` — diagnostics result: everything is OK
- `DiagProblem` — diagnostics result: there is a problem
- `Dispatch` — fleet dispatcher page (do this **last**, as a separate page `/dispatch`, with fake data)

## Part A — the look

1. Look at every screenshot first. Then tell me in 3–5 simple sentences what you see and your plan.
2. Copy the avatar images to `public/avatar/`. Use them like this:
   - start screen and trip summary → `calm.png`
   - small avatar in the corner while driving, phone warning → `watching.png`
   - alarm → `alert.png`
   - talking → `talk.png`
   - diagnostics: listening → `listen.png`, OK → `ok.png`, problem → `problem.png`
3. Rebuild each screen as a **React component** with Tailwind, so it looks the **same** as the screenshot (pixel-close on a 390×844 phone). Keep the texts in Russian exactly as in the design.
4. **Important difference:** in the design the map is a drawing (SVG). In the real app, use the **real MapLibre map** with a dark style, and draw the route line in the same teal color (`#5FC7D4`, width 10, glow `#1B9AAA` 35%). The navigation card, the avatar in the corner, the "Слежу" label and the bottom bar must sit on top of the map exactly like in `Drive`.
5. `Alarm`, `Phone` and `Talk` are **overlays on top of the map**, not new pages. The map keeps moving under them.
6. Make the design come alive (the screenshots are static):
   - avatar in the corner: slow breathing + green dot pulsing;
   - alarm: red border pulses, avatar shakes a little, the text "Эй, не спи!" appears with a pop;
   - phone warning: orange card slides down;
   - talk: the voice bars move while the voice speaks; the bottom sheet slides up;
   - `DiagListen`: the teal rings go out from the avatar like sound waves (already in the HTML as CSS animation), the progress bar fills in 15 seconds;
   - smooth transitions (200–300 ms) between states.
7. Buttons must work: "Поехали" → Drive, "Я в порядке" → close alarm, "Позже" → close talk, "Готово" → start screen. Tap on the avatar in the corner → Talk.
8. Do not change the drowsiness detection logic from before. Only the look.

## Part B — car diagnostics (new feature)

Add a way to open diagnostics: in the avatar panel (tap on avatar) add the button **"Проверить машину"**, and on the start screen add a small secondary button **"Диагностика машины"**.

Flow: `DiagListen` (15 seconds) → `DiagOk` or `DiagProblem`.

**How it works — keep it simple and honest:**

1. **Sound check (real):**
   - Ask for microphone permission. Record 15 seconds with Web Audio API (`getUserMedia({audio:true})` + `AnalyserNode`).
   - Every 100 ms take the frequency spectrum (FFT). Average it into ~32 frequency bands → this is the engine "fingerprint". Also count **sudden loud peaks** (short spikes much louder than the average) → "knocks".
   - The **first** check saves the fingerprint as the "normal" sound (`localStorage`). The screen then says "Запомнил звук мотора. Сравню через неделю".
   - The next checks compare with the saved one (cosine similarity of the bands + number of knocks). Small difference → `DiagOk`. Big difference or many knocks → `DiagProblem`. Put the thresholds in `config.ts`.
   - Draw the two sound waves on `DiagProblem` ("Неделю назад" / "Сегодня") from real data if possible.
2. **OBD error codes (demo mode for now):**
   - Real OBD needs a Bluetooth ELM327 adapter. Most cheap ones use classic Bluetooth, which the browser cannot use. So for now make a **demo OBD module** with fake data: temperature 90 °C, battery 14.1 V, and error code `P0301` only in the "problem" scenario.
   - Put it behind one interface (`obd.ts`), so later we can replace it with a real adapter (Web Bluetooth for BLE adapters, or the Android app later).
   - Add a small dictionary of 10–15 common codes (P0300, P0301, P0171, P0420, P0128, P0562 …) with a **simple Russian explanation** and advice, like: "P0301 — пропуски зажигания в 1-м цилиндре. Доехать до СТО можно, но не гони."
3. **Test buttons for the pitch:** in the hidden test panel add "Тест: мотор ОК" and "Тест: мотор проблема". They play the full flow (15 s listening → result) without the microphone, so the demo always works on stage.
4. "Найти СТО рядом" → open the map with a search for car services nearby (a link to 2GIS search is OK: `https://2gis.kz/search/СТО`).
5. Always show the text from the design: "Это подсказка, не диагноз. Точно скажет только мастер."
6. Voice: when the result is ready, Zholdas says it out loud ("Мотор звучит как обычно" / "Звук мотора изменился. Покажи машину мастеру").

When you finish, show me how to compare: open the app in Chrome DevTools phone mode (390×844) next to the screenshots. Then help me deploy the new version.
