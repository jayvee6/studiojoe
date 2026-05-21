// sj-capture.js — always-on capture/record/trace toolbar for the savers.
//
// Part of the Studio Joe testing-harness library, alongside sj-hud.js
// (perf HUD) and sj-controls.js (parameter panel). Drop-in: one
// <script src="…/lib/sj-capture.js"></script> per page. Exposes a small
// presentation-style icon toolbar (top-right) with:
//
//   ◉ Shot   — crisp PNG of the exact viewport (the canvas pixels only;
//              DOM overlays are NOT in canvas.captureStream, so shots are
//              inherently clean) → POST /__capture → captures/<saver>/.
//   ⏺ Rec    — toggle. canvas.captureStream(60) → MediaRecorder (VP9 webm,
//              high bitrate) → POST on stop. A REC pip shows while active.
//   ∿ Trace  — toggle. Zero-alloc per-frame ring of rAF dt + JS heap
//              samples → perf JSON → POST. Also drops performance.marks so
//              a real Chrome DevTools trace (captured by the MCP/devtools
//              driver — see window.SJCapture.armDevtoolsTrace()) aligns.
//   ⤬ HUD    — toggle visibility of the sj-hud + sj-controls overlays
//              (clean live viewing; the emoji-enable analog).
//
// No-observer-effect: the trace sampler is a single preallocated ring
// write per frame, no allocation, no DOM writes per frame — same
// discipline as sj-hud. Toolbar is a static painted layer (opaque scrim,
// no backdrop-filter over the animating canvas).
//
// Classic script — exposes window.SJCapture. No ES-module MIME dependency.

(() => {
  if (window.SJCapture) return;

  // ---- Identify the saver (filename stem; gallery → 'gallery') ------------
  const stem = (location.pathname.replace(/\/+$/, '').split('/').pop() || 'index')
    .replace(/\.html?$/i, '');
  const SAVER = /^(tideline|lattice|mercury|topography|plasma|pipes)$/.test(stem)
    ? stem : 'gallery';

  const CSS = `
  .sjcap {
    --c1: rgba(255,255,255,0.92); --c2: rgba(255,255,255,0.55);
    --c3: rgba(255,255,255,0.28); --acc: #2DD4BF;
    --bdr: rgba(255,255,255,0.10);
    position: fixed; top: 14px; right: 14px; z-index: 2147483646;
    display: flex; gap: 6px; padding: 6px;
    background: rgba(6,6,8,0.82);
    border: 1px solid var(--bdr); border-radius: 12px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08);
    font: 11px/1 ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;
    user-select: none;
  }
  .sjcap button {
    width: 30px; height: 30px; padding: 0; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.06); color: var(--c1);
    border: 1px solid var(--bdr); border-radius: 8px;
    font: 14px/1 ui-monospace, "SF Mono", monospace;
    transition: background .14s, border-color .14s, color .14s, transform .1s;
  }
  .sjcap button:hover { background: rgba(255,255,255,0.14);
    border-color: rgba(255,255,255,0.4); }
  .sjcap button:active { transform: translateY(1px); }
  .sjcap button:disabled { opacity: .35; cursor: not-allowed; }
  .sjcap button.on { background: var(--acc); border-color: var(--acc);
    color: #04201c; }
  .sjcap-rec {
    position: fixed; top: 52px; right: 16px; z-index: 2147483646;
    display: none; align-items: center; gap: 6px;
    color: #ff5252; font: 11px/1 ui-monospace, "SF Mono", monospace;
    pointer-events: none;
  }
  .sjcap-rec.on { display: flex; }
  .sjcap-rec i { width: 9px; height: 9px; border-radius: 50%;
    background: #ff5252; display: inline-block;
    animation: sjcap-blink 1s steps(2, start) infinite; }
  @keyframes sjcap-blink { 50% { opacity: 0.25; } }
  .sjcap-toast {
    position: fixed; top: 52px; right: 16px; z-index: 2147483647;
    max-width: 60vw; padding: 8px 12px; border-radius: 9px;
    background: rgba(6,6,8,0.92); color: var(--c1);
    border: 1px solid var(--bdr);
    font: 11px/1.4 ui-monospace, "SF Mono", monospace;
    opacity: 0; transform: translateY(-6px);
    transition: opacity .2s, transform .2s; pointer-events: none;
  }
  .sjcap-toast.show { opacity: 1; transform: translateY(0); }`;

  function injectCSS() {
    if (document.getElementById('sjcap-css')) return;
    const s = document.createElement('style');
    s.id = 'sjcap-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function getCanvas() { return document.getElementById('gpu-canvas'); }

  // ---- Transport: POST to serve.js, download fallback --------------------
  async function send(blob, kind, ext) {
    try {
      const r = await fetch('/__capture', {
        method: 'POST',
        headers: { 'x-sj-saver': SAVER, 'x-sj-kind': kind, 'x-sj-ext': ext },
        body: blob,
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      toast('saved → ' + j.path + '  (' + Math.round(j.bytes / 1024) + ' KB)');
      return true;
    } catch (e) {
      // Robustness only (not a second mode): never lose an artifact if the
      // POST sink is unreachable (e.g. opened via file://).
      console.warn('[sj-capture] POST failed (' + e + ') — downloading instead');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = SAVER + '-' + kind + '-' + Date.now() + '.' + ext;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('POST sink unreachable — downloaded ' + a.download);
      return false;
    }
  }

  let toastEl, toastT;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'sjcap-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), 3200);
  }

  // ---- Screenshot: ImageCapture.grabFrame off the canvas stream ----------
  // Works uniformly for WebGPU / WebGL / 2D canvases without needing
  // preserveDrawingBuffer or any cooperation from the saver's render loop.
  async function screenshot() {
    const cv = getCanvas();
    if (!cv) { toast('no #gpu-canvas'); return; }
    try {
      let bmp, track;
      if (typeof cv.captureStream === 'function' && 'ImageCapture' in window) {
        const stream = cv.captureStream();
        track = stream.getVideoTracks()[0];
        const ic = new ImageCapture(track);
        bmp = await ic.grabFrame();
      } else if (typeof createImageBitmap === 'function') {
        bmp = await createImageBitmap(cv);   // fallback path
      } else {
        throw new Error('no ImageCapture / createImageBitmap');
      }
      const off = document.createElement('canvas');
      off.width = bmp.width; off.height = bmp.height;
      off.getContext('2d').drawImage(bmp, 0, 0);
      if (track) track.stop();
      off.toBlob((b) => { if (b) send(b, 'screenshot', 'png'); }, 'image/png');
    } catch (e) {
      console.error('[sj-capture] screenshot failed', e);
      toast('screenshot failed: ' + (e && e.message || e));
    }
  }

  // ---- Recording: canvas.captureStream → MediaRecorder (crisp webm) ------
  let recorder = null, recChunks = null;
  function pickMime() {
    const want = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    for (const m of want) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
    }
    return '';
  }
  function toggleRecord(btn, pip) {
    const cv = getCanvas();
    if (recorder) {
      recorder.stop();
      return;
    }
    if (!cv || typeof cv.captureStream !== 'function' || !window.MediaRecorder) {
      toast('recording unsupported here'); return;
    }
    const mime = pickMime();
    const stream = cv.captureStream(60);
    recChunks = [];
    try {
      recorder = new MediaRecorder(stream, mime
        ? { mimeType: mime, videoBitsPerSecond: 16_000_000 }
        : { videoBitsPerSecond: 16_000_000 });
    } catch (e) { toast('MediaRecorder init failed'); recorder = null; return; }
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) recChunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(recChunks, { type: 'video/webm' });
      recChunks = null;
      stream.getTracks().forEach((t) => t.stop());
      recorder = null;
      btn.classList.remove('on'); pip.classList.remove('on');
      btn.textContent = '⏺';
      send(blob, 'recording', 'webm');
    };
    recorder.start();
    btn.classList.add('on'); pip.classList.add('on');
    btn.textContent = '⏹';
    toast('recording… click ⏹ to stop & save');
  }

  // ---- Perf trace: zero-alloc per-frame ring + JS heap samples ----------
  const RING = 60000;                       // ~10–16 min @ 60fps; preallocated
  const dtBuf = new Float64Array(RING);
  let traceOn = false, traceHead = 0, traceCount = 0;
  let tracePrev = 0, traceStartISO = '', traceStartT = 0, traceRAF = 0;
  const heapSamples = [];                   // sparse (every ~1s), small

  function traceTick(now) {
    if (!traceOn) return;
    if (tracePrev) {
      dtBuf[traceHead] = now - tracePrev;
      traceHead = (traceHead + 1) % RING;
      if (traceCount < RING) traceCount++;
    }
    tracePrev = now;
    traceRAF = requestAnimationFrame(traceTick);
  }
  let heapTimer = 0;
  function startTrace(btn) {
    if (traceOn) return;
    traceOn = true; traceHead = 0; traceCount = 0; tracePrev = 0;
    heapSamples.length = 0;
    traceStartISO = new Date().toISOString();
    traceStartT = performance.now();
    try { performance.mark('sj-trace-start'); } catch (e) {}
    traceRAF = requestAnimationFrame(traceTick);
    heapTimer = setInterval(() => {
      const m = performance.memory;          // Chrome only
      heapSamples.push({
        t: +(performance.now() - traceStartT).toFixed(1),
        usedMB: m ? +(m.usedJSHeapSize / 1048576).toFixed(1) : null,
      });
    }, 1000);
    btn.classList.add('on');
    toast('perf trace recording… click ∿ to stop & save JSON');
  }
  function stopTrace(btn) {
    if (!traceOn) return;
    traceOn = false;
    cancelAnimationFrame(traceRAF);
    clearInterval(heapTimer);
    try { performance.mark('sj-trace-end'); performance.measure('sj-trace', 'sj-trace-start', 'sj-trace-end'); } catch (e) {}
    btn.classList.remove('on');

    // Collect ordered samples + windowed stats (TRUE avg, never EMA — same
    // rule as sj-hud: an EMA lies about drops).
    const n = traceCount, frames = new Array(n);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const v = dtBuf[(traceHead - n + i + RING) % RING];
      frames[i] = +v.toFixed(3); sum += v;
    }
    const sorted = frames.slice().sort((a, b) => a - b);
    const avg = n ? sum / n : 0;
    const p99 = n ? sorted[Math.min(n - 1, Math.floor(n * 0.99))] : 0;
    let drops = 0; for (let i = 0; i < n; i++) if (frames[i] > 33.3) drops++;
    const cv = getCanvas();
    const buildEl = document.getElementById('sjhud-build');
    const trace = {
      saver: SAVER,
      build: buildEl ? buildEl.textContent : null,
      startedAt: traceStartISO,
      endedAt: new Date().toISOString(),
      durationSec: +((performance.now() - traceStartT) / 1000).toFixed(2),
      viewport: {
        w: cv ? cv.width : null, h: cv ? cv.height : null,
        cssW: window.innerWidth, cssH: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
      },
      stats: {
        frames: n,
        avgMs: +avg.toFixed(3),
        fps: +(n ? 1000 / avg : 0).toFixed(2),
        p99Ms: +p99.toFixed(3),
        fpsLow1: +(p99 ? 1000 / p99 : 0).toFixed(2),
        drops: drops,
        dropsPerMin: +(trace_dpm(drops, avg, n)).toFixed(2),
      },
      heap: heapSamples.slice(),
      frameMs: frames,
      note: 'Page-level perf trace. For a full Chrome DevTools flame trace, '
          + 'call window.SJCapture.armDevtoolsTrace() and capture via the '
          + 'DevTools/MCP driver (see HANDOVER.md).',
    };
    const blob = new Blob([JSON.stringify(trace)], { type: 'application/json' });
    send(blob, 'trace', 'json');
  }
  function trace_dpm(drops, avg, n) {
    if (!n || !avg) return 0;
    const totalMin = (n * avg) / 60000;
    return totalMin ? drops / totalMin : 0;
  }

  // ---- Documented DevTools-trace hook (the "real Chrome trace" path) -----
  // Page JS cannot start chrome://tracing. This arms aligned performance
  // marks + a console banner so an external driver (Chrome DevTools
  // Protocol via the Preview/Chrome MCP, or `chrome --trace`) can capture a
  // true flame trace that lines up with the saver timeline.
  let devtoolsArmed = false;
  function armDevtoolsTrace() {
    devtoolsArmed = true;
    try { performance.mark('sj-devtools-trace-armed'); } catch (e) {}
    const msg = '[sj-capture] DevTools trace ARMED for "' + SAVER + '". '
      + 'Start the DevTools/MCP performance capture now; call '
      + 'window.SJCapture.disarmDevtoolsTrace() when done. Marks: '
      + 'sj-devtools-trace-armed … sj-devtools-trace-disarmed.';
    console.info(msg); toast('DevTools trace armed — capture via DevTools/MCP now');
    return msg;
  }
  function disarmDevtoolsTrace() {
    if (!devtoolsArmed) return;
    devtoolsArmed = false;
    try { performance.mark('sj-devtools-trace-disarmed'); } catch (e) {}
    console.info('[sj-capture] DevTools trace disarmed.');
    toast('DevTools trace window closed');
  }

  // ---- Overlay (HUD/controls) visibility toggle -------------------------
  let overlaysHidden = false;
  function toggleOverlays(btn) {
    overlaysHidden = !overlaysHidden;
    const sel = ['.sjhud', '.sjhud-help', '.sjc-panel'];
    sel.forEach((s) => document.querySelectorAll(s).forEach((el) => {
      el.style.display = overlaysHidden ? 'none' : '';
    }));
    btn.classList.toggle('on', overlaysHidden);
    toast(overlaysHidden ? 'HUD/controls hidden' : 'HUD/controls shown');
  }

  // ---- Build the toolbar ------------------------------------------------
  function build() {
    injectCSS();
    const bar = document.createElement('div');
    bar.className = 'sjcap';

    const pip = document.createElement('div');
    pip.className = 'sjcap-rec';
    pip.innerHTML = '<i></i>REC';
    document.body.appendChild(pip);

    const mk = (glyph, title, onClick, id) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = glyph; b.title = title;
      if (id) b.dataset.sjcap = id;
      b.addEventListener('click', () => onClick(b));
      bar.appendChild(b);
      return b;
    };

    mk('◉', 'Screenshot (PNG of the viewport → captures/' + SAVER + ')',
       () => screenshot(), 'shot');
    const recBtn = mk('⏺', 'Record viewport (toggle → webm)',
       (b) => toggleRecord(b, pip), 'rec');
    const trBtn = mk('∿', 'Perf trace (toggle → JSON)',
       (b) => (traceOn ? stopTrace(b) : startTrace(b)), 'trace');
    mk('⤬', 'Show / hide HUD + controls overlays',
       (b) => toggleOverlays(b), 'hud');

    // Disable unsupported capabilities up front (clear UX).
    const cv = getCanvas();
    if (!cv || typeof cv.captureStream !== 'function' || !window.MediaRecorder) {
      recBtn.disabled = true; recBtn.title = 'Recording unsupported in this browser';
    }

    document.body.appendChild(bar);
  }

  if (document.body) build();
  else window.addEventListener('DOMContentLoaded', build);

  window.SJCapture = {
    screenshot,
    startTrace: () => startTrace(document.querySelector('[data-sjcap=trace]')),
    stopTrace: () => stopTrace(document.querySelector('[data-sjcap=trace]')),
    armDevtoolsTrace,
    disarmDevtoolsTrace,
    saver: SAVER,
  };
})();
