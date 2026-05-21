// sj-controls.js — standalone blackhole-grade parameter panel.
//
// The musicplayer-viz app gets its control panel from window.Viz.register +
// renderControlsInto (app infrastructure: needs #sliders-row, #mode-buttons,
// #viz-settings-panel). A standalone showcase page has none of that. This is
// the minimal faithful equivalent: declarative controls[] -> sj-design-styled
// glass panel, a live value getter, and console mirroring (the blackhole
// `window.bh` idiom — tweak window.<ns>.<id> in DevTools, the slider follows).
//
// Classic script — exposes window.SJControls. No ES-module MIME dependency.
//
// SJControls.create({
//   title:  'Tideline',
//   build:  'sv-tideline-001',
//   ns:     'tide',                 // window.tide.<id> console mirror
//   controls: [
//     { id:'speed',  label:'Speed',  type:'slider', min:0, max:3, step:0.01, default:1 },
//     { id:'paused', label:'Pause',  type:'toggle', default:false },
//     { id:'palette',label:'Palette',type:'select', options:['Obsidian','Vellum'], default:'Obsidian' },
//     { id:'restart',label:'Restart',type:'button', onClick:() => {...} },
//   ],
//   onChange: (id, value) => {},    // optional
// }) -> { value(id), set(id,v), all(), panel }
//
// Control types: slider | toggle | select | button.
//   value('speed')  -> number
//   value('paused') -> boolean
//   value('palette')-> string (the option value)
//   value(button)   -> null (use onClick)

(() => {
  if (window.SJControls) return;

  const CSS = `
  .sjc-panel {
    /* sj-design Nocturne tokens, inlined (a shared module can't depend on a
       host :root). Keep in sync with lib/sj-design.css + sj-hud.js. */
    --sjc-label-1: rgba(255,255,255,0.92);
    --sjc-label-2: rgba(255,255,255,0.55);
    --sjc-label-3: rgba(255,255,255,0.28);
    --sjc-accent:  #2DD4BF;
    --sjc-bdr:     rgba(255,255,255,0.10);
    --sjc-shd:     0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08);
    position: fixed; right: 14px; bottom: 14px; z-index: 2147483646;
    width: 244px; max-height: 78vh; display: flex; flex-direction: column;
    color: var(--sjc-label-2);
    font: 11px/1.4 ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;
    font-variant-numeric: tabular-nums;
    /* Near-opaque scrim, NOT backdrop-filter: a blur over the animating
       canvas is recomputed every frame (per-frame GPU cost + observer-effect
       confound). Border + shadow are paint-once. */
    background: rgba(6,6,8,0.86);
    border: 1px solid var(--sjc-bdr);
    border-radius: 13px;
    box-shadow: var(--sjc-shd);
    user-select: none;
  }
  .sjc-hdr {
    display: flex; align-items: baseline; justify-content: space-between;
    padding: 11px 13px; cursor: pointer; gap: 8px;
  }
  .sjc-ttl  { color: var(--sjc-label-1); font-weight: 600; letter-spacing: .02em; }
  .sjc-bld  { color: var(--sjc-label-3); font-size: 10px; margin-left: auto; }
  .sjc-chev { color: var(--sjc-label-3); font-size: 10px; transition: transform .15s; }
  .sjc-panel.sjc-collapsed .sjc-chev { transform: rotate(-90deg); }
  .sjc-body {
    padding: 2px 13px 13px; overflow-y: auto;
    display: flex; flex-direction: column; gap: 11px;
  }
  .sjc-panel.sjc-collapsed .sjc-body { display: none; }
  .sjc-row { display: flex; align-items: center; gap: 9px; }
  .sjc-row label.sjc-name {
    flex: 0 0 84px; color: var(--sjc-label-2);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .sjc-row input[type=range] {
    -webkit-appearance: none; appearance: none;
    flex: 1 1 auto; height: 3px; border-radius: 2px;
    background: rgba(255,255,255,0.2); cursor: pointer; min-width: 60px;
  }
  .sjc-row input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 13px; height: 13px; border-radius: 50%;
    background: rgba(255,255,255,0.9); cursor: pointer;
  }
  .sjc-row input[type=range]::-moz-range-thumb {
    width: 13px; height: 13px; border: 0; border-radius: 50%;
    background: rgba(255,255,255,0.9); cursor: pointer;
  }
  .sjc-val {
    flex: 0 0 42px; text-align: right; color: var(--sjc-label-1);
    font-size: 10px;
  }
  .sjc-row select {
    flex: 1 1 auto; background: rgba(255,255,255,0.06);
    color: var(--sjc-label-1); border: 1px solid var(--sjc-bdr);
    border-radius: 8px; padding: 4px 7px; font: inherit; cursor: pointer;
    outline: none;
  }
  .sjc-row select:focus { border-color: rgba(255,255,255,0.45); }
  .sjc-sw {
    flex: 0 0 34px; height: 18px; border-radius: 999px;
    background: rgba(255,255,255,0.16); position: relative; cursor: pointer;
    transition: background .15s; margin-left: auto;
  }
  .sjc-sw::after {
    content: ''; position: absolute; top: 2px; left: 2px;
    width: 14px; height: 14px; border-radius: 50%;
    background: rgba(255,255,255,0.92); transition: transform .15s;
  }
  .sjc-sw.sjc-on { background: var(--sjc-accent); }
  .sjc-sw.sjc-on::after { transform: translateX(16px); }
  .sjc-btn {
    width: 100%; padding: 7px 0; border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.22);
    background: rgba(255,255,255,0.08); color: var(--sjc-label-1);
    font: 11px/1 ui-monospace, "SF Mono", monospace; font-weight: 600;
    cursor: pointer; transition: background .15s, border-color .15s;
  }
  .sjc-btn:hover { background: rgba(255,255,255,0.16); border-color: rgba(255,255,255,0.4); }
  .sjc-btn:active { transform: translateY(1px); }`;

  function injectCSSOnce() {
    if (document.getElementById('sjc-css')) return;
    const s = document.createElement('style');
    s.id = 'sjc-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function fmt(v, step) {
    if (typeof v !== 'number') return String(v);
    const dec = (step && step < 1) ? Math.min(3, String(step).split('.')[1].length) : 0;
    return v.toFixed(dec);
  }

  function create(opts) {
    opts = opts || {};
    injectCSSOnce();
    const ctrls = opts.controls || [];
    const onChange = opts.onChange || function () {};
    const state = {};            // id -> live value
    const setters = {};          // id -> fn(v) updates DOM + state

    const panel = document.createElement('div');
    panel.className = 'sjc-panel';

    const hdr = document.createElement('div');
    hdr.className = 'sjc-hdr';
    const ttl = document.createElement('span');
    ttl.className = 'sjc-ttl'; ttl.textContent = opts.title || 'Controls';
    const bld = document.createElement('span');
    bld.className = 'sjc-bld'; bld.textContent = opts.build || '';
    const chev = document.createElement('span');
    chev.className = 'sjc-chev'; chev.textContent = '▾';
    hdr.appendChild(ttl); hdr.appendChild(bld); hdr.appendChild(chev);
    hdr.addEventListener('click', () => panel.classList.toggle('sjc-collapsed'));
    panel.appendChild(hdr);

    const body = document.createElement('div');
    body.className = 'sjc-body';
    panel.appendChild(body);

    for (const c of ctrls) {
      const type = c.type || 'slider';
      const row = document.createElement('div');
      row.className = 'sjc-row';

      if (type === 'button') {
        const b = document.createElement('button');
        b.className = 'sjc-btn'; b.textContent = c.label;
        b.addEventListener('click', () => { if (c.onClick) c.onClick(); });
        row.appendChild(b);
        state[c.id] = null;
        setters[c.id] = function () {};
        body.appendChild(row);
        continue;
      }

      const name = document.createElement('label');
      name.className = 'sjc-name'; name.textContent = c.label;
      row.appendChild(name);

      if (type === 'slider') {
        const inp = document.createElement('input');
        inp.type = 'range';
        inp.min = c.min; inp.max = c.max;
        inp.step = (c.step != null ? c.step : 0.01);
        inp.value = c.default;
        const val = document.createElement('span');
        val.className = 'sjc-val'; val.textContent = fmt(+c.default, +inp.step);
        state[c.id] = +c.default;
        const apply = (v) => {
          v = Math.min(+c.max, Math.max(+c.min, +v));
          state[c.id] = v;
          inp.value = v;
          val.textContent = fmt(v, +inp.step);
        };
        inp.addEventListener('input', () => {
          state[c.id] = +inp.value;
          val.textContent = fmt(+inp.value, +inp.step);
          onChange(c.id, state[c.id]);
        });
        setters[c.id] = apply;
        row.appendChild(inp); row.appendChild(val);

      } else if (type === 'toggle') {
        const sw = document.createElement('span');
        sw.className = 'sjc-sw' + (c.default ? ' sjc-on' : '');
        state[c.id] = !!c.default;
        const apply = (v) => {
          state[c.id] = !!v;
          sw.classList.toggle('sjc-on', !!v);
        };
        sw.addEventListener('click', () => {
          apply(!state[c.id]);
          onChange(c.id, state[c.id]);
        });
        setters[c.id] = apply;
        row.appendChild(sw);

      } else if (type === 'select') {
        const sel = document.createElement('select');
        const optList = (c.options || []).map(o =>
          (typeof o === 'string' ? { value: o, label: o } : o));
        for (const o of optList) {
          const oe = document.createElement('option');
          oe.value = o.value; oe.textContent = o.label;
          sel.appendChild(oe);
        }
        sel.value = c.default != null ? c.default : (optList[0] && optList[0].value);
        state[c.id] = sel.value;
        const apply = (v) => { state[c.id] = v; sel.value = v; };
        sel.addEventListener('change', () => {
          state[c.id] = sel.value;
          onChange(c.id, state[c.id]);
        });
        setters[c.id] = apply;
        row.appendChild(sel);
      }

      body.appendChild(row);
    }

    document.body.appendChild(panel);

    const api = {
      value: (id) => state[id],
      set: (id, v) => { if (setters[id]) { setters[id](v); onChange(id, state[id]); } },
      all: () => Object.assign({}, state),
      panel,
    };

    // Console mirror — window.<ns>.<id> get/set, the blackhole `window.bh`
    // idiom: typing window.tide.speed = 2 in DevTools moves the slider.
    if (opts.ns) {
      const mirror = {};
      for (const c of ctrls) {
        if ((c.type || 'slider') === 'button') continue;
        Object.defineProperty(mirror, c.id, {
          enumerable: true,
          get: () => state[c.id],
          set: (v) => api.set(c.id, v),
        });
      }
      window[opts.ns] = mirror;
    }

    return api;
  }

  window.SJControls = { create };
})();
