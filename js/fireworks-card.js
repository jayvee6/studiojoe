// Emoji fireworks on the Emoji Arcade card — the fireworks mode of the old
// homepage sandbox, on its own. Rockets auto-launch every ~2 s while the card
// is on screen; a tap launches one at the pointer. Under reduced motion
// nothing animates. Glyphs are pre-rasterized: drawImage() of a cached glyph
// is ~10x faster than fillText() of color emoji on Windows (Segoe UI Emoji).
(function () {
  'use strict';
  const cv = document.getElementById('fwCanvas');
  let launched = 0;
  window.__fireworks = { rockets: () => launched };
  if (!cv) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = cv.getContext('2d');

  let W = 0, H = 0;
  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(cv);
  else window.addEventListener('resize', fit);
  fit();

  const THEMES = [
    { rocket: '🚀', debris: ['✨','💥','🌟','🎉']       },
    { rocket: '💘', debris: ['💖','💕','❤️','💗','💝']  },
    { rocket: '🪄', debris: ['✨','🌟','💫','⭐','✴️']  },
    { rocket: '🍾', debris: ['🎉','🎊','🥂','🎈']       },
    { rocket: '🌈', debris: ['🦄','💖','⭐','🌟','✨']  },
    { rocket: '🌸', debris: ['🌼','🌺','🌷','🌻','🏵️'] },
    { rocket: '👽', debris: ['🛸','⭐','🌙','🪐','💫']  },
    { rocket: '⚡', debris: ['⭐','✨','💫','🌟','☄️']  },
  ];

  const GLYPH = 0.82, MAX_PX = 56;
  const cache = (() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.ceil((MAX_PX / GLYPH) * dpr);
    const all = new Set();
    for (const t of THEMES) { all.add(t.rocket); t.debris.forEach(d => all.add(d)); }
    const map = {};
    for (const e of all) {
      const oc = document.createElement('canvas');
      oc.width = oc.height = px;
      const o = oc.getContext('2d');
      o.font = px * GLYPH + 'px serif';
      o.textAlign = 'center'; o.textBaseline = 'middle';
      o.fillText(e, px / 2, px / 2);
      map[e] = oc;
    }
    return map;
  })();
  function drawEmoji(e, x, y, size) {
    const img = cache[e];
    if (!img) return;
    const box = size / GLYPH, h = box / 2;
    ctx.drawImage(img, x - h, y - h, box, box);
  }

  const rockets = [], debris = [];
  const MAX_DEBRIS = 900;
  const GRAVITY = 360;   // px/s², rockets and debris
  const rng = (a, b) => a + Math.random() * (b - a);

  function launchRocket(x) {
    const theme = THEMES[(Math.random() * THEMES.length) | 0];
    const z = rng(0, 1), scale = 0.65 + z * 0.55;   // depth: far = small
    const apexY = rng(H * 0.12, H * 0.42);
    const vy = -Math.sqrt(2 * GRAVITY * (H - apexY)) * rng(0.95, 1.08);
    rockets.push({ x: x != null ? x : rng(W * 0.1, W * 0.9), y: H + 8, vx: rng(-30, 30), vy,
      emoji: theme.rocket, theme, scale, trail: [], life: 0 });
    launched++;
  }
  function detonate(r) {
    const count = (24 + r.scale * 36) | 0;
    const base = 120 * r.scale, lift = -40 * r.scale;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rng(-0.04, 0.04);
      const s = base * rng(0.7, 1.15);
      debris.push({ x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s + lift,
        emoji: r.theme.debris[(Math.random() * r.theme.debris.length) | 0],
        size: rng(12, 19) * r.scale, rot: rng(-1, 1), vr: rng(-2, 2),
        age: 0, life: rng(1.4, 2.3) * (0.85 + r.scale * 0.3) });
    }
  }

  function draw(dt) {
    ctx.fillStyle = 'rgba(6,6,8,0.18)';   // low-alpha fill = motion trail
    ctx.fillRect(0, 0, W, H);
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.life += dt; r.vy += GRAVITY * dt; r.x += r.vx * dt; r.y += r.vy * dt;
      r.trail.push(r.x, r.y);
      if (r.trail.length > 18) r.trail.splice(0, r.trail.length - 18);
      if (r.vy >= 0 || r.life > 2.4 || r.y < 0) { detonate(r); rockets.splice(i, 1); continue; }
      for (let k = 0; k < r.trail.length; k += 2) {
        const a = k / r.trail.length;
        ctx.globalAlpha = a * 0.6 * r.scale;
        drawEmoji(r.emoji, r.trail[k], r.trail[k + 1], 10 * r.scale * a);
      }
      ctx.globalAlpha = 1;
      drawEmoji(r.emoji, r.x, r.y, 20 * r.scale);
    }
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.age += dt;
      if (d.age >= d.life || d.y > H + 30) { debris.splice(i, 1); continue; }
      d.vy += GRAVITY * 0.65 * dt; d.vx *= 0.985; d.vy *= 0.985;
      d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.vr * dt;
      const a = 1 - d.age / d.life;
      ctx.save();
      ctx.translate(d.x, d.y); ctx.rotate(d.rot);
      ctx.globalAlpha = a * a;
      drawEmoji(d.emoji, 0, 0, d.size);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (debris.length > MAX_DEBRIS) debris.splice(0, debris.length - MAX_DEBRIS);
  }

  cv.addEventListener('pointerdown', ev => {
    const r = cv.getBoundingClientRect();
    launchRocket(ev.clientX - r.left);
  });

  let onScreen = false, nextAuto = 0, tp;
  new IntersectionObserver(es => { onScreen = es[es.length - 1].isIntersecting; }).observe(cv);

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!onScreen || document.hidden) { tp = ts; return; }
    const dt = Math.min(0.05, ((ts - (tp ?? ts)) / 1000)); tp = ts;
    if (ts >= nextAuto && rockets.length < 3) { launchRocket(); nextAuto = ts + 2000; }
    draw(dt);
  }
  requestAnimationFrame(frame);
})();
