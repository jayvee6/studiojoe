// Clip wall + Play previews: muted loops play only while they are on screen and the tab
// is visible. Under prefers-reduced-motion no video source is ever attached,
// so the poster stays. A play() that fails (blocked, slow, 404) leaves the
// poster showing; nothing else depends on it.
(function () {
  'use strict';
  const videos = [...document.querySelectorAll('.tile-video[data-src], .play-video[data-src]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const visible = new Set();

  window.__wall = { playing: (sel = '.tile-video') => videos.filter(v => v.matches(sel) && !v.paused).length };
  if (reduced || !videos.length) return;

  function start(v) {
    if (!v.getAttribute('src')) v.src = v.dataset.src;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  }

  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) { visible.add(e.target); if (!document.hidden) start(e.target); }
      else { visible.delete(e.target); e.target.pause(); }
    }
  }, { threshold: 0.15 });
  videos.forEach(v => io.observe(v));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos.forEach(v => v.pause());
    else visible.forEach(start);
  });
})();
