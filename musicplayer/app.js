// ─── Color utilities ─────────────────────────────────────────────────────────

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = t => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  return [hue(h + 1/3), hue(h), hue(h - 1/3)].map(v => Math.round(v * 255));
}

function boostColor([r, g, b]) {
  let [h, s, l] = rgbToHsl(r, g, b);
  s = Math.min(100, Math.max(s, 65));
  l = Math.min(65,  Math.max(l, 45));
  return hslToRgb(h, s, l);
}

// ─── Visualizer ──────────────────────────────────────────────────────────────

const colorThief  = new ColorThief();
const visualizer  = document.querySelector('.visualizer');
const blobEls     = ['.blob-1', '.blob-2', '.blob-3', '.blob-4'].map(s => document.querySelector(s));

let beatInterval = null;
const BEAT_INTERVAL = 500; // 120 BPM
const BEAT_HOLD_MS  = 120;

function applyPalette(palette) {
  palette.slice(0, 4).forEach((raw, i) => {
    const [r, g, b] = boostColor(raw);
    blobEls[i].style.background = `radial-gradient(circle, rgb(${r},${g},${b}), transparent 70%)`;
  });
}

function extractColors(img) {
  try { applyPalette(colorThief.getPalette(img, 4)); }
  catch (e) { console.warn('Color extraction failed', e); }
}

function simulateBeat() {
  visualizer.style.setProperty('--beat-scale', '1.10');
  setTimeout(() => visualizer.style.setProperty('--beat-scale', '1'), BEAT_HOLD_MS);
}

function startBeat() {
  simulateBeat();
  beatInterval = setInterval(simulateBeat, BEAT_INTERVAL);
}

function stopBeat() {
  clearInterval(beatInterval);
  beatInterval = null;
  visualizer.style.setProperty('--beat-scale', '1');
}

// ─── iPod state machine ───────────────────────────────────────────────────────

const views     = { picker: document.getElementById('view-picker'), nowplaying: document.getElementById('view-nowplaying') };
const menuItems = Array.from(document.querySelectorAll('.menu-item'));
const albumArt  = document.getElementById('album-art');
const wheelEl   = document.getElementById('wheel');
const centerBtn = document.getElementById('wheel-center');

let selectedIndex = 0;

function showView(name) {
  Object.entries(views).forEach(([k, el]) => el.classList.toggle('hidden', k !== name));
}

function updateSelection() {
  menuItems.forEach((el, i) => el.classList.toggle('selected', i === selectedIndex));
}

// Scroll wheel — rotate gesture changes selection
let lastAngle = null;
let accumulatedDelta = 0;
const SCROLL_THRESHOLD = 25; // degrees per step

function getAngle(e, rect) {
  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;
  const x  = (e.clientX ?? e.touches?.[0]?.clientX) - cx;
  const y  = (e.clientY ?? e.touches?.[0]?.clientY) - cy;
  return Math.atan2(y, x) * (180 / Math.PI);
}

function onWheelMove(e) {
  const rect  = wheelEl.getBoundingClientRect();
  const angle = getAngle(e, rect);
  if (lastAngle === null) { lastAngle = angle; return; }
  let delta = angle - lastAngle;
  if (delta >  180) delta -= 360;
  if (delta < -180) delta += 360;
  lastAngle = angle;
  accumulatedDelta += delta;
  if (Math.abs(accumulatedDelta) >= SCROLL_THRESHOLD) {
    const dir = accumulatedDelta > 0 ? 1 : -1;
    selectedIndex = (selectedIndex + dir + menuItems.length) % menuItems.length;
    updateSelection();
    accumulatedDelta = 0;
  }
}

wheelEl.addEventListener('mousemove',  e => { if (e.buttons === 1) onWheelMove(e); });
wheelEl.addEventListener('touchmove',  e => { e.preventDefault(); onWheelMove(e); }, { passive: false });
wheelEl.addEventListener('mouseleave', () => { lastAngle = null; accumulatedDelta = 0; });
wheelEl.addEventListener('mouseup',    () => { lastAngle = null; accumulatedDelta = 0; });
wheelEl.addEventListener('touchend',   () => { lastAngle = null; accumulatedDelta = 0; });

// Direct click on menu items
menuItems.forEach((el, i) => {
  el.addEventListener('click', () => {
    selectedIndex = i;
    updateSelection();
    selectService(el.dataset.service);
  });
});

// Center button selects
centerBtn.addEventListener('click', e => {
  e.stopPropagation();
  const current = menuItems[selectedIndex];
  if (current) selectService(current.dataset.service);
});

function selectService(service) {
  if (service === 'spotify') {
    console.log('→ Spotify auth flow');
    // TODO: kick off Spotify PKCE OAuth
    showNowPlaying();
  } else if (service === 'apple') {
    console.log('→ Apple Music auth flow');
    // TODO: kick off MusicKit JS auth
    showNowPlaying();
  }
}

function showNowPlaying() {
  showView('nowplaying');
  if (albumArt.complete && albumArt.naturalWidth) {
    extractColors(albumArt);
    startBeat();
  } else {
    albumArt.addEventListener('load', () => { extractColors(albumArt); startBeat(); });
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

showView('picker');
updateSelection();
