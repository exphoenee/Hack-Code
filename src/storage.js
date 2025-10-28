import { HS_KEY } from './constants.js';

export function loadHighScore() {
  try {
    return Number(localStorage.getItem(HS_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(v) {
  try {
    localStorage.setItem(HS_KEY, String(v));
  } catch {}
}

