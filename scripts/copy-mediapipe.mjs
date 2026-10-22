// Copies MediaPipe WASM files into public/, so the app does not need Google servers.
import { cpSync, mkdirSync } from 'node:fs'

mkdirSync('public/mediapipe/wasm', { recursive: true })
cpSync('node_modules/@mediapipe/tasks-vision/wasm', 'public/mediapipe/wasm', { recursive: true })
console.log('MediaPipe WASM copied to public/mediapipe/wasm')
