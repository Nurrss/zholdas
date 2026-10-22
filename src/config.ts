// All numbers in one place. Change them here.

export const config = {
  // --- Detection (used from step 2) ---
  eyeClosedThreshold: 0.55, // eyeBlinkLeft and eyeBlinkRight must be above this
  eyeClosedThresholdHeadDown: 0.8, // when the head is down, eyes look half-closed, so we need more
  eyeClosedAlarmSec: 2.0, // eyes closed this long -> alarm
  normalBlinkSec: 0.4, // shorter closes are normal blinks
  yawnThreshold: 0.35, // jawOpen above this
  yawnMinSec: 0.8, // mouth open this long -> yawn
  yawnsBeforeStopAdvice: 2,
  calibrationSec: 3.0, // driver looks straight at start
  headDownFactor: 1.18, // ratio > baseline * this -> head down
  headDownWarnSec: 3.0,
  sideYawDeg: 30, // head turned more than this left or right (from the calibrated position)
  sideSec: 3.0, // ...this long -> "looking to the side". Mirror checks are shorter, so they are ignored.
  noFaceSec: 3.0,
  phraseCooldownSec: 4.0, // same phrase not more often than this
  detectionFps: 20, // how often we check the face
  alarmBeepEverySec: 1.0,
  alarmAutoCloseSec: 5.0, // alarm closes by itself after eyes are open this long
  warningMinShowSec: 2.0, // orange warning stays at least this long
  speechBubbleSec: 4.0, // avatar text bubble
  talkAutoCloseSec: 12, // Talk sheet that opened by itself closes after this
  pauseMin: 10, // "Пауза 10 минут"

  // --- Car diagnostics by sound ---
  diagSec: 15, // how long we listen to the engine
  engineBands: 32, // frequency bands in the "fingerprint"
  engineMinHz: 40,
  engineMaxHz: 8000,
  engineSimilarityOk: 0.9, // cosine similarity with the saved sound; below this -> problem
  knockPeakFactor: 6, // a "knock" is a peak this many times louder than the average level
  knockMinGapSec: 0.3, // peaks closer than this are one knock
  knocksForProblem: 3, // this many knocks (and more than last time) -> problem
  engineMinLevel: 0.002, // average level below this = "I can't hear the engine"

  // --- Demo drive ---
  demoSpeedKmh: 90,
  demoSpeedMultiplier: 1, // make the car move faster on the map (1 = real speed)
  mapZoom: 15.5,
  mapPitch: 0, // flat, like the design
  mapStyleUrl: 'https://tiles.openfreemap.org/styles/dark',
}
