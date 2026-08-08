// ceci et la nouvelle version
/*!
 * websim.mp4 — a single-file, dependency-free video player
 * Built to be dropped in as a near-identical replacement for the
 * <video-player><video-skin><video></video-skin></video-player> markup style.
 *
 * Usage:
 *   <script type="module" src="/path/to/websim.js"></script>
 *
 *   <video-player>
 *     <video-skin>
 *       <video src="movie.mp4" playsinline></video>
 *     </video-skin>
 *   </video-player>
 *
 * Customizing colors (optional — sensible defaults if you skip this):
 *   <video-player
 *     data-accent="#7c3aed"
 *     data-accent-text="#ffffff"
 *     data-progress-bg="rgba(255,255,255,0.25)"
 *     data-controls-bg="rgba(0,0,0,0.85)">
 *     ...
 *   </video-player>
 *
 * Or via plain CSS, since everything reads from custom properties:
 *   video-player { --ws-accent: #7c3aed; }
 *
 * No other files, no CSS link, no build step. Everything (styles, icons,
 * controls, keyboard shortcuts, big play button, scrubber, volume, time,
 * fullscreen, PiP, playback rate, settings menu) lives in this one script.
 */
(() => {
  'use strict';

  const NS = 'websim-mp4';
  if (customElements.get('video-player')) return; // idempotent

  // ---------------------------------------------------------------------
  // Icons (inline SVG strings, stroke-based, mirrors a video.js-like set)
  // ---------------------------------------------------------------------
  const ICONS = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
    replay: '<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>',
    volHigh: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    volLow: '<svg viewBox="0 0 24 24"><path d="M18.5 12A4.5 4.5 0 0016 8v8a4.5 4.5 0 002.5-4zM3 9v6h4l5 5V4L7 9H3z"/></svg>',
    volMute: '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><path d="M19.14 12.94a7.14 7.14 0 000-1.88l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.03 7.03 0 00-1.63-.94l-.36-2.54a.5.5 0 00-.5-.42h-3.84a.5.5 0 00-.5.42l-.36 2.54c-.59.24-1.13.56-1.63.94l-2.39-.96a.5.5 0 00-.6.22L2.7 8.84a.5.5 0 00.12.64l2.03 1.58a7.14 7.14 0 000 1.88l-2.03 1.58a.5.5 0 00-.12.64l1.92 3.32c.14.24.42.32.6.22l2.39-.96c.5.38 1.04.7 1.63.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.63-.94l2.39.96c.24.1.5.02.6-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/></svg>',
    fsEnter: '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
    fsExit: '<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>',
    pip: '<svg viewBox="0 0 24 24"><path d="M19 7H9c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H9V9h10v6zM3 5h12v2H3v12h8v2H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
  };

  // ---------------------------------------------------------------------
  // Styles — injected once. Colors are driven by CSS custom properties so
  // each <video-player> instance can override them independently.
  // ---------------------------------------------------------------------
  const STYLE_ID = `${NS}-styles`;
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
video-player {
  display: block;
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 10px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1;
  -webkit-user-select: none;
  user-select: none;
  box-shadow: 0 10px 40px rgba(0,0,0,0.35);
}
video-skin {
  display: block;
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  overflow: hidden;
}
video-player[data-fullscreen="true"] {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  box-shadow: none;
}
video-player[data-fullscreen="true"] video-skin {
  aspect-ratio: unset;
  height: 100%;
}
video-skin > video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}
.ws-overlay-btn {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 0;
  margin: 0;
}
.ws-big-play-ring {
  position: absolute;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  border: 1.5px solid color-mix(in srgb, var(--ws-accent, #e50914) 55%, transparent);
  opacity: 0;
  pointer-events: none;
  animation: ws-pulse 2.6s ease-out infinite;
}
video-player[data-playing="true"] .ws-big-play-ring { animation-play-state: paused; opacity: 0; }
@keyframes ws-pulse {
  0% { transform: scale(0.78); opacity: 0; }
  35% { opacity: .55; }
  100% { transform: scale(1.18); opacity: 0; }
}
.ws-big-play {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(155deg, color-mix(in srgb, var(--ws-accent, #e50914) 88%, #000 0%), color-mix(in srgb, var(--ws-accent, #e50914) 55%, #000 30%));
  border: 1.5px solid rgba(255,255,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px color-mix(in srgb, var(--ws-accent, #e50914) 45%, transparent), 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.25);
  transition: transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease, filter .18s ease;
}
.ws-overlay-btn:hover .ws-big-play {
  transform: scale(1.08);
  filter: brightness(1.12);
  box-shadow: 0 14px 38px color-mix(in srgb, var(--ws-accent, #e50914) 60%, transparent), 0 2px 10px rgba(0,0,0,0.55), inset 0 1px 1px rgba(255,255,255,0.3);
}
.ws-overlay-btn:active .ws-big-play {
  transform: scale(0.98);
}
.ws-big-play svg {
  width: 32px;
  height: 32px;
  fill: #ffffff;
  margin-left: 4px;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35));
}
video-player[data-playing="true"] .ws-big-play-wrap {
  opacity: 0;
  transform: scale(0.85);
  pointer-events: none;
}
.ws-big-play-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity .2s ease, transform .2s ease;
}
.ws-spinner {
  position: absolute;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
video-player[data-waiting="true"] .ws-spinner { display: flex; }
.ws-spinner::after {
  content: "";
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.2);
  border-top-color: var(--ws-accent, #e50914);
  animation: ws-spin .8s linear infinite;
}
@keyframes ws-spin { to { transform: rotate(360deg); } }

.ws-controls {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  padding: 34px 12px 10px;
  background: linear-gradient(to top, var(--ws-controls-bg-top, rgba(0,0,0,0.88)) 0%, var(--ws-controls-bg-mid, rgba(0,0,0,0.5)) 50%, rgba(0,0,0,0) 100%);
  opacity: 1;
  transform: translateY(0);
  transition: opacity .25s ease, transform .25s ease;
  z-index: 3;
}
video-player[data-controls-hidden="true"] .ws-controls {
  opacity: 0;
  transform: translateY(6px);
  pointer-events: none;
}
video-player[data-controls-hidden="true"] {
  cursor: none;
}

.ws-progress-row {
  position: relative;
  height: 16px;
  margin: 0 6px 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  touch-action: none;
}
.ws-progress-track {
  position: relative;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--ws-progress-bg, rgba(255,255,255,0.25));
  transition: height .12s ease;
  pointer-events: none;
}
.ws-progress-row:hover .ws-progress-track,
.ws-progress-row.ws-scrubbing .ws-progress-track { height: 7px; }
.ws-progress-buffered {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 0%;
  background: var(--ws-buffered-bg, rgba(255,255,255,0.4));
  border-radius: 2px;
}
.ws-progress-played {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 0%;
  background: var(--ws-accent, #e50914);
  border-radius: 2px;
  box-shadow: 0 0 8px color-mix(in srgb, var(--ws-accent, #e50914) 60%, transparent);
}
.ws-progress-handle {
  position: absolute;
  top: 50%;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--ws-accent, #e50914);
  box-shadow: 0 1px 4px rgba(0,0,0,0.5);
  transform: translate(-50%, -50%) scale(0);
  transition: transform .15s cubic-bezier(.34,1.56,.64,1);
  left: 0%;
  pointer-events: none;
}
.ws-progress-row:hover .ws-progress-handle,
.ws-progress-row.ws-scrubbing .ws-progress-handle {
  transform: translate(-50%, -50%) scale(1);
}
.ws-progress-tooltip {
  position: absolute;
  bottom: 20px;
  transform: translateX(-50%);
  background: rgba(15,15,17,0.95);
  color: var(--ws-text, #ffffff);
  font-size: 11px;
  font-weight: 600;
  padding: 3px 7px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity .12s ease;
}
.ws-progress-row:hover .ws-progress-tooltip,
.ws-progress-row.ws-scrubbing .ws-progress-tooltip { opacity: 1; }

.ws-preview {
  position: absolute;
  bottom: 36px;
  transform: translateX(-50%);
  width: 160px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
  border: 2px solid var(--ws-menu-bg, rgba(24,24,27,0.96));
  box-shadow: 0 8px 26px rgba(0,0,0,0.55);
  opacity: 0;
  pointer-events: none;
  transition: opacity .12s ease;
  z-index: 4;
}
.ws-progress-row:hover .ws-preview,
.ws-progress-row.ws-scrubbing .ws-preview { opacity: 1; }
.ws-preview canvas {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ws-preview-time {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  text-align: center;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0));
  font-variant-numeric: tabular-nums;
}

.ws-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 2px;
}
.ws-spacer { flex: 1; }

.ws-btn {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--ws-text, #ffffff);
  cursor: pointer;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  opacity: 0.9;
  transition: opacity .15s ease, background .15s ease, transform .15s ease;
  flex-shrink: 0;
}
.ws-btn:hover { opacity: 1; background: rgba(255,255,255,0.14); transform: translateY(-1px); }
.ws-btn:active { transform: translateY(0); }
.ws-btn svg { width: 20px; height: 20px; fill: currentColor; }
.ws-btn:focus-visible, .ws-progress-row:focus-visible {
  outline: 2px solid var(--ws-accent, #e50914);
  outline-offset: 2px;
}

.ws-time {
  color: var(--ws-text, #ffffff);
  font-size: 12.5px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  padding: 0 8px;
  white-space: nowrap;
  opacity: 0.92;
}

.ws-vol {
  display: flex;
  align-items: center;
}
.ws-vol-track-wrap {
  width: 0;
  overflow: hidden;
  transition: width .18s ease;
  display: flex;
  align-items: center;
}
.ws-vol:hover .ws-vol-track-wrap,
.ws-vol.ws-vol-active .ws-vol-track-wrap {
  width: 64px;
}
.ws-vol-track {
  position: relative;
  width: 56px;
  height: 4px;
  border-radius: 2px;
  background: var(--ws-progress-bg, rgba(255,255,255,0.25));
  margin-right: 10px;
  cursor: pointer;
}
.ws-vol-fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 100%;
  background: var(--ws-accent, #e50914);
  border-radius: 2px;
}

.ws-menu {
  position: absolute;
  right: 10px;
  bottom: 50px;
  background: var(--ws-menu-bg, rgba(20,20,23,0.97));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 6px 0;
  min-width: 150px;
  box-shadow: 0 14px 36px rgba(0,0,0,0.55);
  display: flex;
  flex-direction: column;
  z-index: 5;
  max-height: 220px;
  overflow-y: auto;
  opacity: 0;
  transform: translateY(6px) scale(0.97);
  pointer-events: none;
  transition: opacity .14s ease, transform .14s cubic-bezier(.2,.9,.3,1.2);
}
.ws-menu.ws-open {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}
.ws-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 14px;
  color: #eee;
  font-size: 12.5px;
  cursor: pointer;
  white-space: nowrap;
  transition: background .1s ease;
}
.ws-menu-item:hover { background: rgba(255,255,255,0.1); }
.ws-menu-item[data-active="true"] {
  background: color-mix(in srgb, var(--ws-accent, #e50914) 16%, transparent);
}
.ws-menu-item svg { width: 14px; height: 14px; fill: var(--ws-accent, #e50914); visibility: hidden; }
.ws-menu-item[data-active="true"] svg { visibility: visible; }
.ws-menu-header {
  padding: 6px 14px 8px;
  color: rgba(255,255,255,0.5);
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
}

video-player * { box-sizing: border-box; }
`;
    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------
  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    sec = Math.floor(sec);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  // Maps data-* attributes on <video-player> to CSS custom properties,
  // so colors can be customized straight from the markup with no CSS file.
  const COLOR_ATTR_MAP = {
    'data-accent': '--ws-accent',
    'data-accent-text': '--ws-accent-text',
    'data-text': '--ws-text',
    'data-progress-bg': '--ws-progress-bg',
    'data-buffered-bg': '--ws-buffered-bg',
    'data-controls-bg': '--ws-controls-bg-top',
    'data-controls-bg-mid': '--ws-controls-bg-mid',
    'data-big-play-bg': '--ws-big-play-bg',
    'data-big-play-border': '--ws-big-play-border',
    'data-menu-bg': '--ws-menu-bg',
  };
  function applyColorAttrs(node) {
    for (const [attr, cssVar] of Object.entries(COLOR_ATTR_MAP)) {
      const val = node.getAttribute(attr);
      if (val) node.style.setProperty(cssVar, val);
    }
  }

  // ---------------------------------------------------------------------
  // <video-skin> — a thin wrapper, mostly just a styling hook (like video.js)
  // ---------------------------------------------------------------------
  class VideoSkin extends HTMLElement {}
  customElements.define('video-skin', VideoSkin);

  // ---------------------------------------------------------------------
  // <video-player> — the whole player
  // ---------------------------------------------------------------------
  class VideoPlayer extends HTMLElement {
    constructor() {
      super();
      this._hideTimer = null;
      this._scrubbing = false;
      this._rate = 1;
      this._volDragging = false;
      // Bound handlers kept as instance refs so window listeners can be removed on disconnect.
      this._onWinMouseMove = (e) => {
        if (this._scrubbing) this._moveScrub(e);
        if (this._volDragging) this._applyVol(e);
      };
      this._onWinMouseUp = (e) => {
        if (this._scrubbing) this._endScrub(e);
        this._volDragging = false;
      };
      this._onDocClick = () => this._rateMenu && this._rateMenu.classList.remove('ws-open');
    }

    connectedCallback() {
      injectStyles();
      applyColorAttrs(this);
      if (this._built) return;
      this._built = true;
      if (!this.querySelector('video')) {
        requestAnimationFrame(() => this._build());
      } else {
        this._build();
      }
      window.addEventListener('mousemove', this._onWinMouseMove);
      window.addEventListener('mouseup', this._onWinMouseUp);
      document.addEventListener('click', this._onDocClick);
    }

    disconnectedCallback() {
      window.removeEventListener('mousemove', this._onWinMouseMove);
      window.removeEventListener('mouseup', this._onWinMouseUp);
      document.removeEventListener('click', this._onDocClick);
      this._clearHide();
      if (this._shadowVideo) {
        this._shadowVideo.src = '';
        this._shadowVideo.remove();
      }
    }

    _build() {
      const skin = this.querySelector('video-skin') || this;
      const video = this.querySelector('video');
      if (!video) return;
      this._video = video;
      this._skin = skin;

      video.controls = false;
      video.setAttribute('playsinline', '');
      this.setAttribute('data-playing', 'false');
      this.setAttribute('data-waiting', 'false');
      this.setAttribute('data-controls-hidden', 'false');
      this.tabIndex = 0;

      this._buildUI();
      this._bindVideoEvents();
      this._bindUIEvents();
      this._bindKeyboard();
      this._bindIdleHide();
      this._syncVolumeUI();
    }

    _buildUI() {
      // big play overlay
      const bigWrap = el('div', 'ws-big-play-wrap');
      const bigBtn = el('button', 'ws-overlay-btn', '');
      bigBtn.setAttribute('aria-label', 'Play');
      bigBtn.tabIndex = -1;
      const bigRing = el('div', 'ws-big-play-ring');
      const bigCircle = el('div', 'ws-big-play', ICONS.play);
      bigBtn.append(bigRing, bigCircle);
      bigWrap.appendChild(bigBtn);
      this._skin.appendChild(bigWrap);
      this._bigBtn = bigBtn;
      this._bigCircle = bigCircle;

      // spinner
      this._skin.appendChild(el('div', 'ws-spinner'));

      // controls bar
      const controls = el('div', 'ws-controls');

      // progress
      const progressRow = el('div', 'ws-progress-row');
      progressRow.tabIndex = 0;
      progressRow.setAttribute('role', 'slider');
      progressRow.setAttribute('aria-label', 'Seek');
      const track = el('div', 'ws-progress-track');
      const buffered = el('div', 'ws-progress-buffered');
      const played = el('div', 'ws-progress-played');
      const handle = el('div', 'ws-progress-handle');
      const tooltip = el('div', 'ws-progress-tooltip', '0:00');
      track.append(buffered, played, handle);
      const preview = el('div', 'ws-preview');
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = 160;
      previewCanvas.height = 90;
      const previewTime = el('div', 'ws-preview-time', '0:00');
      preview.append(previewCanvas, previewTime);
      progressRow.append(track, preview, tooltip);
      controls.appendChild(progressRow);
      Object.assign(this, {
        _progressRow: progressRow, _buffered: buffered, _played: played,
        _handle: handle, _tooltip: tooltip,
        _preview: preview, _previewCanvas: previewCanvas, _previewTime: previewTime,
      });
      this._initPreview();

      // button bar
      const bar = el('div', 'ws-bar');

      const playBtn = el('button', 'ws-btn', ICONS.play);
      playBtn.setAttribute('aria-label', 'Play');
      this._playBtn = playBtn;

      const replayBtn = el('button', 'ws-btn', ICONS.replay);
      replayBtn.setAttribute('aria-label', 'Replay');
      replayBtn.style.display = 'none';
      this._replayBtn = replayBtn;

      const volWrap = el('div', 'ws-vol');
      const volBtn = el('button', 'ws-btn', ICONS.volHigh);
      volBtn.setAttribute('aria-label', 'Mute');
      const volTrackWrap = el('div', 'ws-vol-track-wrap');
      const volTrack = el('div', 'ws-vol-track');
      const volFill = el('div', 'ws-vol-fill');
      volTrack.appendChild(volFill);
      volTrackWrap.appendChild(volTrack);
      volWrap.append(volBtn, volTrackWrap);
      this._volBtn = volBtn;
      this._volTrack = volTrack;
      this._volFill = volFill;
      this._volWrap = volWrap;

      const time = el('div', 'ws-time', '0:00 / 0:00');
      this._time = time;

      const spacer = el('div', 'ws-spacer');

      const rateBtn = el('button', 'ws-btn', '<span style="font-size:12px;font-weight:600;">1x</span>');
      rateBtn.setAttribute('aria-label', 'Playback speed');
      this._rateBtn = rateBtn;

      const pipBtn = el('button', 'ws-btn', ICONS.pip);
      pipBtn.setAttribute('aria-label', 'Picture in picture');
      if (!('pictureInPictureEnabled' in document) || this._video.disablePictureInPicture) {
        pipBtn.style.display = 'none';
      }

      const fsBtn = el('button', 'ws-btn', ICONS.fsEnter);
      fsBtn.setAttribute('aria-label', 'Fullscreen');
      this._fsBtn = fsBtn;
      if (!document.fullscreenEnabled) fsBtn.style.display = 'none';

      bar.append(playBtn, replayBtn, volWrap, time, spacer, rateBtn, pipBtn, fsBtn);
      controls.appendChild(bar);
      this._skin.appendChild(controls);
      this._controls = controls;

      // rate menu (single settings/speed menu — no duplicate button)
      const rateMenu = el('div', 'ws-menu');
      rateMenu.appendChild(el('div', 'ws-menu-header', 'Speed'));
      [0.5, 0.75, 1, 1.25, 1.5, 2].forEach((r) => {
        const item = el('div', 'ws-menu-item');
        item.dataset.rate = String(r);
        item.dataset.active = r === 1 ? 'true' : 'false';
        item.innerHTML = `<span>${r === 1 ? 'Normal' : r + 'x'}</span>${ICONS.check}`;
        rateMenu.appendChild(item);
      });
      this._skin.appendChild(rateMenu);
      this._rateMenu = rateMenu;

      this._pipBtn = pipBtn;
    }

    _bindVideoEvents() {
      const v = this._video;
      v.addEventListener('play', () => {
        this.setAttribute('data-playing', 'true');
        this._playBtn.innerHTML = ICONS.pause;
        this._playBtn.setAttribute('aria-label', 'Pause');
        this._bigCircle.innerHTML = ICONS.pause;
        this._scheduleHide();
      });
      v.addEventListener('pause', () => {
        this.setAttribute('data-playing', 'false');
        this._playBtn.innerHTML = ICONS.play;
        this._playBtn.setAttribute('aria-label', 'Play');
        this._bigCircle.innerHTML = ICONS.play;
        this._clearHide();
      });
      v.addEventListener('waiting', () => this.setAttribute('data-waiting', 'true'));
      v.addEventListener('playing', () => this.setAttribute('data-waiting', 'false'));
      v.addEventListener('canplay', () => this.setAttribute('data-waiting', 'false'));
      v.addEventListener('timeupdate', () => this._updateProgress());
      v.addEventListener('progress', () => this._updateBuffered());
      v.addEventListener('loadedmetadata', () => this._updateProgress());
      v.addEventListener('volumechange', () => this._syncVolumeUI());
      v.addEventListener('ended', () => {
        this.setAttribute('data-controls-hidden', 'false');
        this._replayBtn.style.display = '';
      });
      v.addEventListener('error', () => this.setAttribute('data-waiting', 'false'));
    }

    // ---------------------------------------------------------------
    // Hover preview thumbnail (YouTube-style).
    // Uses a second, hidden <video> pointed at the same source, seeked
    // silently in the background and drawn onto a canvas. No sprite
    // sheet or server support required — works with any playable src.
    // ---------------------------------------------------------------
    _initPreview() {
      const setup = () => {
        if (this._shadowVideo) return; // already set up
        const src = this._video.currentSrc || this._video.src;
        if (!src) return;
        const shadow = document.createElement('video');
        shadow.src = src;
        shadow.muted = true;
        shadow.preload = 'auto';
        shadow.crossOrigin = this._video.crossOrigin || 'anonymous';
        shadow.style.position = 'absolute';
        shadow.style.width = '1px';
        shadow.style.height = '1px';
        shadow.style.opacity = '0';
        shadow.style.pointerEvents = 'none';
        shadow.tabIndex = -1;
        shadow.setAttribute('aria-hidden', 'true');
        this._skin.appendChild(shadow);
        this._shadowVideo = shadow;
        this._previewReady = false;
        this._previewSeeking = false;
        this._previewQueued = null;
        shadow.addEventListener('loadeddata', () => { this._previewReady = true; });
        shadow.addEventListener('seeked', () => {
          this._previewSeeking = false;
          this._drawPreviewFrame();
          if (this._previewQueued !== null) {
            const t = this._previewQueued;
            this._previewQueued = null;
            this._seekPreview(t);
          }
        });
        shadow.addEventListener('error', () => { this._previewReady = false; });
      };
      if (this._video.currentSrc || this._video.src) setup();
      else this._video.addEventListener('loadedmetadata', setup, { once: true });
    }

    _seekPreview(t) {
      const shadow = this._shadowVideo;
      if (!shadow || !this._previewReady) return;
      if (this._previewSeeking) {
        this._previewQueued = t;
        return;
      }
      const clamped = Math.min(Math.max(t, 0), (shadow.duration || this._video.duration || t) - 0.05);
      if (Math.abs(shadow.currentTime - clamped) < 0.2) return; // close enough, skip redundant seek
      this._previewSeeking = true;
      shadow.currentTime = clamped;
    }

    _drawPreviewFrame() {
      const shadow = this._shadowVideo;
      const canvas = this._previewCanvas;
      if (!shadow || !canvas) return;
      const ctx = canvas.getContext('2d');
      try {
        ctx.drawImage(shadow, 0, 0, canvas.width, canvas.height);
      } catch (err) { /* frame not ready / cross-origin without CORS headers — skip silently */ }
    }

    _updatePreview(ratio) {
      const v = this._video;
      if (!v.duration || !this._preview) return;
      const t = ratio * v.duration;
      this._previewTime.textContent = fmtTime(t);
      const clampPx = Math.max(84, Math.min(this._progressRow.clientWidth - 84, ratio * this._progressRow.clientWidth));
      this._preview.style.left = clampPx + 'px';
      this._seekPreview(t);
    }

    _bindUIEvents() {
      const v = this._video;
      const toggle = () => (v.paused ? v.play() : v.pause());

      this._bigBtn.addEventListener('click', toggle);
      this._playBtn.addEventListener('click', toggle);
      this._skin.addEventListener('click', (e) => {
        if (e.target === this._skin || e.target === v) toggle();
      });
      this._skin.addEventListener('dblclick', () => this._toggleFullscreen());

      this._replayBtn.addEventListener('click', () => {
        v.currentTime = 0;
        this._replayBtn.style.display = 'none';
        v.play();
      });

      // --- Progress scrubbing -------------------------------------
      // Bound as instance methods (not locals) so window-level mousemove/up
      // (registered once in connectedCallback) can reach the same scrub
      // state — this is what makes dragging past the row's edges, or
      // releasing outside it, still work correctly.
      this._seekFromEvent = (e) => {
        const rect = this._progressRow.getBoundingClientRect();
        let clientX;
        if (e.changedTouches && e.changedTouches.length) clientX = e.changedTouches[0].clientX;
        else if (e.touches && e.touches.length) clientX = e.touches[0].clientX;
        else clientX = e.clientX;
        const x = clientX - rect.left;
        return Math.min(1, Math.max(0, rect.width ? x / rect.width : 0));
      };
      this._applyScrubUI = (ratio) => {
        this._played.style.width = ratio * 100 + '%';
        this._handle.style.left = ratio * 100 + '%';
        this._tooltip.style.left = ratio * 100 + '%';
        this._tooltip.textContent = fmtTime(ratio * (v.duration || 0));
        this._updatePreview(ratio);
      };
      this._progressRow.addEventListener('mousemove', (e) => {
        if (!v.duration || this._scrubbing) return;
        const ratio = this._seekFromEvent(e);
        this._tooltip.style.left = ratio * 100 + '%';
        this._tooltip.textContent = fmtTime(ratio * v.duration);
        this._updatePreview(ratio);
        // restore the played bar to the real position after just previewing
        const real = v.currentTime / v.duration;
        this._played.style.width = real * 100 + '%';
        this._handle.style.left = real * 100 + '%';
      });
      this._progressRow.addEventListener('mousedown', (e) => this._startScrub(e));
      this._progressRow.addEventListener('touchstart', (e) => this._startScrub(e), { passive: true });
      this._progressRow.addEventListener('touchmove', (e) => this._moveScrub(e), { passive: true });
      this._progressRow.addEventListener('touchend', (e) => this._endScrub(e));
      this._progressRow.addEventListener('keydown', (e) => {
        if (!v.duration) return;
        if (e.key === 'ArrowRight') v.currentTime = Math.min(v.duration, v.currentTime + 5);
        if (e.key === 'ArrowLeft') v.currentTime = Math.max(0, v.currentTime - 5);
      });

      // volume
      this._volBtn.addEventListener('click', () => {
        v.muted = !v.muted;
        if (!v.muted && v.volume === 0) v.volume = 0.5;
      });
      this._applyVol = (e) => {
        const rect = this._volTrack.getBoundingClientRect();
        let clientX;
        if (e.changedTouches && e.changedTouches.length) clientX = e.changedTouches[0].clientX;
        else if (e.touches && e.touches.length) clientX = e.touches[0].clientX;
        else clientX = e.clientX;
        const x = clientX - rect.left;
        const ratio = Math.min(1, Math.max(0, rect.width ? x / rect.width : 0));
        v.volume = ratio;
        v.muted = ratio === 0;
      };
      this._volTrack.addEventListener('mousedown', (e) => { this._volDragging = true; this._applyVol(e); });
      this._volTrack.addEventListener('touchstart', (e) => { this._applyVol(e); }, { passive: true });
      this._volTrack.addEventListener('touchmove', (e) => { this._applyVol(e); }, { passive: true });
      this._volWrap.addEventListener('mouseenter', () => this._volWrap.classList.add('ws-vol-active'));
      this._volWrap.addEventListener('mouseleave', () => this._volWrap.classList.remove('ws-vol-active'));

      // rate/settings menu (single button, single menu)
      this._rateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._rateMenu.classList.toggle('ws-open');
      });
      this._rateMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = e.target.closest('.ws-menu-item');
        if (!item) return;
        const rate = parseFloat(item.dataset.rate);
        v.playbackRate = rate;
        this._rate = rate;
        this._rateBtn.innerHTML = `<span style="font-size:12px;font-weight:600;">${rate}x</span>`;
        [...this._rateMenu.children].forEach((c) => {
          if (c.dataset.rate) c.dataset.active = String(parseFloat(c.dataset.rate) === rate);
        });
        this._rateMenu.classList.remove('ws-open');
      });

      // pip
      this._pipBtn.addEventListener('click', async () => {
        try {
          if (document.pictureInPictureElement) await document.exitPictureInPicture();
          else await v.requestPictureInPicture();
        } catch (err) { /* no-op: PiP unsupported or blocked */ }
      });

      // fullscreen
      this._fsBtn.addEventListener('click', () => this._toggleFullscreen());
      document.addEventListener('fullscreenchange', () => {
        const isFs = document.fullscreenElement === this;
        this.setAttribute('data-fullscreen', String(isFs));
        this._fsBtn.innerHTML = isFs ? ICONS.fsExit : ICONS.fsEnter;
      });
    }

    _startScrub(e) {
      const v = this._video;
      if (!v.duration) return;
      this._scrubbing = true;
      this._progressRow.classList.add('ws-scrubbing');
      this._applyScrubUI(this._seekFromEvent(e));
    }
    _moveScrub(e) {
      if (!this._scrubbing) return;
      this._applyScrubUI(this._seekFromEvent(e));
    }
    _endScrub(e) {
      if (!this._scrubbing) return;
      this._scrubbing = false;
      this._progressRow.classList.remove('ws-scrubbing');
      const v = this._video;
      if (v.duration) v.currentTime = this._seekFromEvent(e) * v.duration;
    }

    _bindKeyboard() {
      this.addEventListener('keydown', (e) => {
        const v = this._video;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'k', 'f', 'm'].includes(e.key)) {
          e.preventDefault();
        }
        switch (e.key) {
          case ' ':
          case 'k':
            v.paused ? v.play() : v.pause();
            break;
          case 'ArrowRight':
            v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
            break;
          case 'ArrowLeft':
            v.currentTime = Math.max(0, v.currentTime - 5);
            break;
          case 'ArrowUp':
            v.volume = Math.min(1, v.volume + 0.1);
            break;
          case 'ArrowDown':
            v.volume = Math.max(0, v.volume - 0.1);
            break;
          case 'f':
            this._toggleFullscreen();
            break;
          case 'm':
            v.muted = !v.muted;
            break;
        }
      });
    }

    _bindIdleHide() {
      const show = () => {
        this.setAttribute('data-controls-hidden', 'false');
        this._scheduleHide();
      };
      this.addEventListener('mousemove', show);
      this.addEventListener('mouseenter', show);
      this.addEventListener('focusin', show);
      this.addEventListener('mouseleave', () => {
        if (!this._video.paused) this._scheduleHide(200);
      });
      // Touch devices never fire mousemove/mouseenter, so without this the
      // controls (and the label) would stay on screen forever once shown.
      // A tap anywhere on the player reveals controls and re-arms the
      // auto-hide timer, same as a mouse move would.
      this.addEventListener('touchstart', show, { passive: true });
    }

    _scheduleHide(delay = 2600) {
      this._clearHide();
      this._hideTimer = setTimeout(() => {
        if (!this._video.paused && !this._scrubbing && !this._rateMenu.classList.contains('ws-open')) {
          this.setAttribute('data-controls-hidden', 'true');
        }
      }, delay);
    }
    _clearHide() {
      if (this._hideTimer) clearTimeout(this._hideTimer);
      this.setAttribute('data-controls-hidden', 'false');
    }

    _updateProgress() {
      const v = this._video;
      if (!v.duration || this._scrubbing) return;
      const ratio = v.currentTime / v.duration;
      this._played.style.width = ratio * 100 + '%';
      this._handle.style.left = ratio * 100 + '%';
      this._time.textContent = `${fmtTime(v.currentTime)} / ${fmtTime(v.duration)}`;
      if (v.currentTime > 0) this._replayBtn.style.display = 'none';
    }

    _updateBuffered() {
      const v = this._video;
      if (!v.duration || !v.buffered.length) return;
      const end = v.buffered.end(v.buffered.length - 1);
      this._buffered.style.width = Math.min(100, (end / v.duration) * 100) + '%';
    }

    _syncVolumeUI() {
      const v = this._video;
      const ratio = v.muted ? 0 : v.volume;
      this._volFill.style.width = ratio * 100 + '%';
      this._volBtn.innerHTML = ratio === 0 ? ICONS.volMute : ratio < 0.5 ? ICONS.volLow : ICONS.volHigh;
      this._volBtn.setAttribute('aria-label', ratio === 0 ? 'Unmute' : 'Mute');
    }

    _toggleFullscreen() {
      if (document.fullscreenElement === this) document.exitFullscreen();
      else if (this.requestFullscreen) this.requestFullscreen();
    }
  }

  customElements.define('video-player', VideoPlayer);
})();
