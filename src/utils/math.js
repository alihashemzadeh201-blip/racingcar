import * as THREE from 'three';

export function damp(a, b, lambda, dt) {
  return THREE.MathUtils.damp(a, b, lambda, dt);
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function saturate(v) {
  return clamp(v, 0, 1);
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function randi(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function pick(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

export function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function angleDiff(a, b) {
  return wrapAngle(b - a);
}

export function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  const ms = Math.floor((s % 1) * 1000);
  const ss = Math.floor(s);
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

export function hash01(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}
