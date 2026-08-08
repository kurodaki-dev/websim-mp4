/*!
 * websim.mp4 — a single-file, dependency-free video player
 * Drop-in replacement markup style for <video-player><video-skin><video></video-skin></video-player>.
 *
 * Usage:
 *   <script type="module" src="/path/to/index.js"></script>
 *
 *   <video-player>
 *     <video-skin>
 *       <video playsinline poster="cover.jpg">
 *         <source src="video-1080.mp4" type="video/mp4" data-quality="1080p" data-default>
 *         <source src="video-720.mp4"  type="video/mp4" data-quality="720p">
 *         <source src="video-480.mp4"  type="video/mp4" data-quality="480p">
 *         <track kind="subtitles" src="fr.vtt" srclang="fr" label="Français" default>
 *         <track kind="subtitles" src="en.vtt" srclang="en" label="English">
 *       </video>
 *     </video-skin>
 *   </video-player>
 *
 * Everything the source markup doesn't provide is simply skipped: no <source
 * data-quality> → no quality menu, no <track> → no subtitle menu, no
 * data-chapters → no chapter markers. Nothing has to be turned on manually.
 *
 * No other files, no CSS link, no build step. Everything (styles, icons,
 * controls, keyboard shortcuts, big play button, scrubber with chapters,
 * volume, time, quality switcher, subtitle switcher, fullscreen, PiP,
 * playback rate, unified settings menu) lives in this one script.
 */
(() => {
  'use strict';

  const NS = 'websim-mp4';
  if (customElements.get('video-player')) return; // idempotent

  // ---------------------------------------------------------------------
  // Icons
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
    back: '<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>',
    chevron: '<svg viewBox="0 0 24 24"><path d="M9.29 6.71a1 1 0 000 1.41L13.17 12l-3.88 3.88a1 1 0 101.41 1.41l4.59-4.59a1 1 0 000-1.41L10.7 6.71a1 1 0 00-1.41 0z"/></svg>',
    cc: '<svg viewBox="0 0 24 24"><path d="M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8.5 10.5H9c-.28 0-.5-.22-.5-.5v-4c0-.28.22-.5.5-.5h1.5v1H9.5v3H10.5v1zm5 0H14c-.28 0-.5-.22-.5-.5v-4c0-.28.22-.5.5-.5h1.5v1H14.5v3H15.5v1z"/></svg>',
    quality: '<svg viewBox="0 0 24 24"><path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z"/></svg>',
    speed: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 11h-2V7h2v6zm3.54 3.54l-1.42-1.42L13 14.5l1.12-1.12 2.42 2.42-1 1.24z"/></svg>',
    volOff: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3z"/></svg>',
  };

  const QUALITY_LABEL_ORDER = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];

  // ---------------------------------------------------------------------
  // Styles
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1;
  -webkit-user-select: none;
  user-select: none;
}
video-skin {
  display: block;
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  overflow: hidden;
  border-radius: 6px;
}
video-player[data-fullscreen="true"] video-skin {
  border-radius: 0;
  aspect-ratio: unset;
  height: 100%;
}
video-player[data-fullscreen="true"] {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  width: 100vw;
  height: 100vh;
}
video-skin > video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}
video-skin > video::cue {
  background: rgba(0,0,0,0.75);
  font-size: 1.05em;
  padding: 2px 6px;
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
.ws-big-play {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(20, 20, 22, 0.72);
  border: 2px solid rgba(255,255,255,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform .15s ease, background .15s ease;
  pointer-events: none;
}
.ws-overlay-btn:hover .ws-big-play {
  transform: scale(1.08);
  background: rgba(229, 9, 20, 0.85);
}
.ws-big-play svg {
  width: 30px;
  height: 30px;
  fill: #fff;
  margin-left: 4px;
}
video-player[data-playing="true"] .ws-big-play-wrap {
  opacity: 0;
  pointer-events: none;
}
.ws-big-play-wrap {
  position: absolute;
  inset: 0;
  transition: opacity .2s ease;
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
  border: 3px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  animation: ws-spin .8s linear infinite;
}
@keyframes ws-spin { to { transform: rotate(360deg); } }

.ws-flash {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%) scale(0.85);
  width: 76px; height: 76px;
  border-radius: 50%;
  background: rgba(20,20,22,0.75);
  display: flex; align-items: center; justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity .25s ease, transform .25s ease;
  z-index: 4;
}
.ws-flash.ws-flash-show {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  transition: opacity .05s ease, transform .05s ease;
}
.ws-flash svg { width: 34px; height: 34px; fill: #fff; }

.ws-controls {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  padding: 28px 10px 8px;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0) 100%);
  opacity: 1;
  transform: translateY(0);
  transition: opacity .25s ease, transform .25s ease;
  z-index: 3;
}
video-player[data-controls-hidden="true"] .ws-controls {
  opacity: 0;
  transform: translateY(4px);
  pointer-events: none;
}
video-player[data-controls-hidden="true"] {
  cursor: none;
}

.ws-progress-row {
  position: relative;
  height: 14px;
  margin: 0 6px 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.ws-progress-track {
  position: relative;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.25);
  transition: height .12s ease;
}
.ws-progress-row:hover .ws-progress-track { height: 6px; }
.ws-progress-buffered {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 0%;
  background: rgba(255,255,255,0.4);
  border-radius: 2px;
}
.ws-progress-played {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 0%;
  background: #e50914;
  border-radius: 2px;
}
.ws-chapter-tick {
  position: absolute;
  top: 0; bottom: 0;
  width: 2px;
  background: rgba(0,0,0,0.55);
  z-index: 1;
}
.ws-progress-handle {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e50914;
  transform: translate(-50%, -50%) scale(0);
  transition: transform .12s ease;
  left: 0%;
  z-index: 2;
}
.ws-progress-row:hover .ws-progress-handle,
.ws-progress-row.ws-scrubbing .ws-progress-handle {
  transform: translate(-50%, -50%) scale(1);
}
.ws-progress-tooltip {
  position: absolute;
  bottom: 16px;
  transform: translateX(-50%);
  background: rgba(20,20,22,0.95);
  color: #fff;
  font-size: 11px;
  padding: 3px 7px;
  border-radius: 3px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity .1s ease;
  text-align: center;
  z-index: 3;
}
.ws-progress-tooltip .ws-tt-chapter {
  display: block;
  font-weight: 600;
  margin-bottom: 1px;
}
.ws-progress-row:hover .ws-progress-tooltip { opacity: 1; }

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
  color: #fff;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  opacity: 0.92;
  transition: opacity .12s ease, background .12s ease;
  flex-shrink: 0;
  position: relative;
}
.ws-btn:hover { opacity: 1; background: rgba(255,255,255,0.12); }
.ws-btn.ws-btn-active { opacity: 1; color: #e50914; }
.ws-btn svg { width: 20px; height: 20px; fill: currentColor; }
.ws-btn:focus-visible, .ws-progress-row:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
.ws-cc-dot {
  position: absolute;
  bottom: 6px; right: 6px;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #e50914;
  display: none;
}
.ws-btn.ws-btn-active .ws-cc-dot { display: block; }

.ws-time {
  color: #fff;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  padding: 0 6px;
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
  transition: width .15s ease;
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
  background: rgba(255,255,255,0.25);
  margin-right: 8px;
  cursor: pointer;
}
.ws-vol-fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 100%;
  background: #fff;
  border-radius: 2px;
}

.ws-menu {
  position: absolute;
  right: 8px;
  bottom: 46px;
  background: rgba(24,24,27,0.97);
  backdrop-filter: blur(6px);
  border-radius: 8px;
  padding: 6px 0;
  min-width: 190px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.45);
  display: none;
  flex-direction: column;
  z-index: 5;
  max-height: 260px;
  overflow-y: auto;
}
.ws-menu.ws-open { display: flex; }
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
}
.ws-menu-item:hover { background: rgba(255,255,255,0.1); }
.ws-menu-item-left { display: flex; align-items: center; gap: 8px; }
.ws-menu-item-left svg { width: 15px; height: 15px; fill: #ccc; flex-shrink: 0; }
.ws-menu-item .ws-check { width: 14px; height: 14px; fill: #e50914; visibility: hidden; flex-shrink: 0; }
.ws-menu-item[data-active="true"] .ws-check { visibility: visible; }
.ws-menu-item .ws-chev { width: 14px; height: 14px; fill: #888; flex-shrink: 0; }
.ws-menu-item .ws-side-label { color: #888; font-size: 11.5px; }
.ws-menu-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  margin-bottom: 4px;
  cursor: pointer;
}
.ws-menu-header svg { width: 15px; height: 15px; fill: #fff; }
.ws-menu-section-label {
  padding: 6px 14px 2px;
  color: rgba(255,255,255,0.45);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .05em;
}
.ws-panel { display: none; }
.ws-panel.ws-panel-active { display: flex; flex-direction: column; }

.ws-label {
  position: absolute;
  top: 10px;
  left: 12px;
  color: rgba(255,255,255,0.55);
  font-size: 10.5px;
  letter-spacing: .06em;
  text-transform: uppercase;
  z-index: 2;
  pointer-events: none;
}

.ws-chapter-title {
  position: absolute;
  top: 10px;
  right: 12px;
  max-width: 55%;
  color: rgba(255,255,255,0.85);
  font-size: 11px;
  z-index: 2;
  pointer-events: none;
  text-align: right;
  opacity: 0;
  transition: opacity .2s ease;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}
.ws-chapter-title.ws-show { opacity: 1; }

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

  function parseChapters(video) {
    // Optional: <video data-chapters='[{"time":0,"title":"Intro"}, ...]'>
    const raw = video.getAttribute('data-chapters');
    if (!raw) return null;
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length) {
        return list
          .filter((c) => typeof c.time === 'number' && c.title)
          .sort((a, b) => a.time - b.time);
      }
    } catch (e) { /* malformed JSON, ignore */ }
    return null;
  }

  // ---------------------------------------------------------------------
  // <video-skin>
  // ---------------------------------------------------------------------
  class VideoSkin extends HTMLElement {}
  customElements.define('video-skin', VideoSkin);

  // ---------------------------------------------------------------------
  // <video-player>
  // ---------------------------------------------------------------------
  class VideoPlayer extends HTMLElement {
    constructor() {
      super();
      this._hideTimer = null;
      this._flashTimer = null;
      this._chapterLabelTimer = null;
      this._scrubbing = false;
      this._rate = 1;
      this._chapters = null;
      this._qualities = []; // [{label, src, type, source}]
      this._currentQualityIdx = -1;
      this._menuStack = ['root'];
    }

    connectedCallback() {
      injectStyles();
      if (this._built) return;
      this._built = true;
      if (!this.querySelector('video')) {
        requestAnimationFrame(() => this._build());
      } else {
        this._build();
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

      this._detectQualities();
      this._chapters = parseChapters(video);

      this._buildUI();
      this._bindVideoEvents();
      this._bindUIEvents();
      this._bindKeyboard();
      this._bindIdleHide();
      this._bindTextTracks();
      this._syncVolumeUI();
    }

    // -------------------------------------------------------------
    // Quality detection: <source data-quality="720p" data-default>
    // If no data-quality sources exist, the whole quality feature
    // silently stays off — video plays its normal src/source as-is.
    // -------------------------------------------------------------
    _detectQualities() {
      const sources = [...this._video.querySelectorAll('source[data-quality]')];
      if (!sources.length) return;
      this._qualities = sources.map((s) => ({
        label: s.getAttribute('data-quality'),
        src: s.getAttribute('src'),
        type: s.getAttribute('type') || '',
        isDefault: s.hasAttribute('data-default'),
      }));
      this._qualities.sort((a, b) => {
        const ia = QUALITY_LABEL_ORDER.indexOf(a.label);
        const ib = QUALITY_LABEL_ORDER.indexOf(b.label);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
      let idx = this._qualities.findIndex((q) => q.isDefault);
      if (idx === -1) idx = 0;
      this._currentQualityIdx = idx;
      // Point the <video> at the chosen quality directly (remove <source> children
      // to avoid the browser auto-picking one on its own).
      this._video.querySelectorAll('source').forEach((s) => s.remove());
      this._video.src = this._qualities[idx].src;
    }

    _switchQuality(idx, { resume = true } = {}) {
      if (idx === this._currentQualityIdx) return;
      const v = this._video;
      const wasPaused = v.paused;
      const t = v.currentTime;
      this._currentQualityIdx = idx;
      v.src = this._qualities[idx].src;
      const restore = () => {
        v.removeEventListener('loadedmetadata', restore);
        if (resume) v.currentTime = t;
        if (!wasPaused) v.play();
      };
      v.addEventListener('loadedmetadata', restore);
      v.load();
      this._refreshQualityMenu();
    }

    // -------------------------------------------------------------
    // Subtitles: any <track kind="subtitles"|"captions"> just works.
    // If there are none, the CC button never appears.
    // -------------------------------------------------------------
    _bindTextTracks() {
      const tracks = [...this._video.querySelectorAll('track')].filter((t) =>
        ['subtitles', 'captions'].includes(t.getAttribute('kind') || 'subtitles')
      );
      if (!tracks.length) {
        this._ccBtn.style.display = 'none';
        return;
      }
      // Default: whichever <track default> exists, else off.
      const list = this._video.textTracks;
      for (let i = 0; i < list.length; i++) list[i].mode = 'disabled';
      let defaultIdx = tracks.findIndex((t) => t.hasAttribute('default'));
      if (defaultIdx !== -1 && list[defaultIdx]) {
        list[defaultIdx].mode = 'showing';
        this._ccBtn.classList.add('ws-btn-active');
      }
      this._refreshSubtitleMenu();
    }

    _refreshSubtitleMenu() {
      const list = this._video.textTracks;
      const panel = this._subtitlePanel;
      if (!panel) return;
      panel.innerHTML = '';
      panel.appendChild(this._menuBackHeader('Sous-titres'));
      const offItem = this._menuItem('Désactivés', null, list.length && [...list].every((t) => t.mode !== 'showing'));
      offItem.addEventListener('click', () => {
        for (let i = 0; i < list.length; i++) list[i].mode = 'disabled';
        this._ccBtn.classList.remove('ws-btn-active');
        this._refreshSubtitleMenu();
        this._closeMenu();
      });
      panel.appendChild(offItem);
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        const item = this._menuItem(t.label || t.language || `Piste ${i + 1}`, null, t.mode === 'showing');
        item.addEventListener('click', () => {
          for (let j = 0; j < list.length; j++) list[j].mode = j === i ? 'showing' : 'disabled';
          this._ccBtn.classList.add('ws-btn-active');
          this._refreshSubtitleMenu();
          this._closeMenu();
        });
        panel.appendChild(item);
      }
    }

    _refreshQualityMenu() {
      const panel = this._qualityPanel;
      if (!panel) return;
      panel.innerHTML = '';
      panel.appendChild(this._menuBackHeader('Qualité'));
      this._qualities.forEach((q, i) => {
        const item = this._menuItem(q.label, null, i === this._currentQualityIdx);
        item.addEventListener('click', () => {
          this._switchQuality(i);
          this._closeMenu();
        });
        panel.appendChild(item);
      });
    }

    _menuItem(label, sideLabel, active) {
      const item = el('div', 'ws-menu-item');
      item.dataset.active = String(!!active);
      item.innerHTML = `<span class="ws-menu-item-left">${ICONS.check.replace('svg', 'svg class="ws-check"')}<span>${label}</span></span>${sideLabel ? `<span class="ws-side-label">${sideLabel}</span>` : ''}`;
      return item;
    }

    _menuBackHeader(title) {
      const header = el('div', 'ws-menu-header', `${ICONS.back}<span>${title}</span>`);
      header.addEventListener('click', () => this._showPanel('root'));
      return header;
    }

    _showPanel(name) {
      [...this._menu.querySelectorAll('.ws-panel')].forEach((p) => {
        p.classList.toggle('ws-panel-active', p.dataset.panel === name);
      });
    }

    _closeMenu() {
      this._menu.classList.remove('ws-open');
      this._showPanel('root');
    }

    // -------------------------------------------------------------
    // UI build
    // -------------------------------------------------------------
    _buildUI() {
      const label = el('div', 'ws-label', 'websim.mp4');
      this._skin.appendChild(label);

      if (this._chapters) {
        this._chapterTitleEl = el('div', 'ws-chapter-title', '');
        this._skin.appendChild(this._chapterTitleEl);
      }

      // big play overlay
      const bigWrap = el('div', 'ws-big-play-wrap');
      const bigBtn = el('button', 'ws-overlay-btn', '');
      bigBtn.setAttribute('aria-label', 'Lecture');
      bigBtn.tabIndex = -1;
      const bigCircle = el('div', 'ws-big-play', ICONS.play);
      bigBtn.appendChild(bigCircle);
      bigWrap.appendChild(bigBtn);
      this._skin.appendChild(bigWrap);
      this._bigBtn = bigBtn;
      this._bigCircle = bigCircle;

      // spinner
      this._skin.appendChild(el('div', 'ws-spinner'));

      // center flash (play/pause/seek feedback)
      const flash = el('div', 'ws-flash', '');
      this._skin.appendChild(flash);
      this._flash = flash;

      // controls bar
      const controls = el('div', 'ws-controls');

      // progress
      const progressRow = el('div', 'ws-progress-row');
      progressRow.tabIndex = 0;
      progressRow.setAttribute('role', 'slider');
      progressRow.setAttribute('aria-label', 'Progression');
      const track = el('div', 'ws-progress-track');
      const buffered = el('div', 'ws-progress-buffered');
      const played = el('div', 'ws-progress-played');
      const handle = el('div', 'ws-progress-handle');
      const tooltip = el('div', 'ws-progress-tooltip', '0:00');
      track.append(buffered, played, handle);
      progressRow.append(track, tooltip);
      controls.appendChild(progressRow);
      Object.assign(this, {
        _progressRow: progressRow, _buffered: buffered, _played: played,
        _handle: handle, _tooltip: tooltip, _track: track,
      });

      if (this._chapters && this._chapters.length > 1) {
        this._chapters.forEach((c) => {
          const tick = el('div', 'ws-chapter-tick');
          tick.dataset.time = String(c.time);
          track.appendChild(tick);
        });
      }

      // button bar
      const bar = el('div', 'ws-bar');

      const playBtn = el('button', 'ws-btn', ICONS.play);
      playBtn.setAttribute('aria-label', 'Lecture');
      this._playBtn = playBtn;

      const replayBtn = el('button', 'ws-btn', ICONS.replay);
      replayBtn.setAttribute('aria-label', 'Revoir');
      replayBtn.style.display = 'none';
      this._replayBtn = replayBtn;

      const volWrap = el('div', 'ws-vol');
      const volBtn = el('button', 'ws-btn', ICONS.volHigh);
      volBtn.setAttribute('aria-label', 'Muet');
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

      // CC (subtitles) toggle button — hidden if no tracks (handled in _bindTextTracks)
      const ccBtn = el('button', 'ws-btn', ICONS.cc + '<span class="ws-cc-dot"></span>');
      ccBtn.setAttribute('aria-label', 'Sous-titres');
      this._ccBtn = ccBtn;

      const settingsBtn = el('button', 'ws-btn', ICONS.settings);
      settingsBtn.setAttribute('aria-label', 'Paramètres');

      const pipBtn = el('button', 'ws-btn', ICONS.pip);
      pipBtn.setAttribute('aria-label', 'Picture-in-picture');
      if (!('pictureInPictureEnabled' in document)) pipBtn.style.display = 'none';

      const fsBtn = el('button', 'ws-btn', ICONS.fsEnter);
      fsBtn.setAttribute('aria-label', 'Plein écran');
      this._fsBtn = fsBtn;

      bar.append(playBtn, replayBtn, volWrap, time, spacer, ccBtn, settingsBtn, pipBtn, fsBtn);
      controls.appendChild(bar);
      this._skin.appendChild(controls);
      this._controls = controls;

      // -----------------------------------------------------------
      // Unified settings menu: root panel lists Speed / Quality / Subtitles
      // as sub-panels, each entry only appears if the feature is available.
      // -----------------------------------------------------------
      const menu = el('div', 'ws-menu');
      const rootPanel = el('div', 'ws-panel ws-panel-active');
      rootPanel.dataset.panel = 'root';

      const speedRow = el('div', 'ws-menu-item');
      speedRow.innerHTML = `<span class="ws-menu-item-left">${ICONS.speed}<span>Vitesse</span></span><span class="ws-side-label" data-role="speed-current">Normale</span>${ICONS.chevron.replace('svg', 'svg class="ws-chev"')}`;
      speedRow.addEventListener('click', () => this._showPanel('speed'));
      rootPanel.appendChild(speedRow);
      this._speedCurrentLabel = speedRow.querySelector('[data-role="speed-current"]');

      if (this._qualities.length > 1) {
        const qualityRow = el('div', 'ws-menu-item');
        qualityRow.innerHTML = `<span class="ws-menu-item-left">${ICONS.quality}<span>Qualité</span></span><span class="ws-side-label" data-role="quality-current">${this._qualities[this._currentQualityIdx].label}</span>${ICONS.chevron.replace('svg', 'svg class="ws-chev"')}`;
        qualityRow.addEventListener('click', () => this._showPanel('quality'));
        rootPanel.appendChild(qualityRow);
        this._qualityCurrentLabel = qualityRow.querySelector('[data-role="quality-current"]');
      }

      menu.appendChild(rootPanel);

      // speed panel (always available)
      const speedPanel = el('div', 'ws-panel');
      speedPanel.dataset.panel = 'speed';
      speedPanel.appendChild(this._menuBackHeader('Vitesse'));
      [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].forEach((r) => {
        const item = this._menuItem(r === 1 ? 'Normale' : r + 'x', null, r === 1);
        item.dataset.rate = String(r);
        item.addEventListener('click', () => {
          this._video.playbackRate = r;
          this._rate = r;
          this._speedCurrentLabel.textContent = r === 1 ? 'Normale' : r + 'x';
          [...speedPanel.querySelectorAll('.ws-menu-item[data-rate]')].forEach((c) => {
            c.dataset.active = String(parseFloat(c.dataset.rate) === r);
          });
          this._closeMenu();
        });
        speedPanel.appendChild(item);
      });
      menu.appendChild(speedPanel);

      // quality panel (only meaningful if >1 quality, but harmless if built anyway)
      if (this._qualities.length > 1) {
        const qualityPanel = el('div', 'ws-panel');
        qualityPanel.dataset.panel = 'quality';
        menu.appendChild(qualityPanel);
        this._qualityPanel = qualityPanel;
        this._refreshQualityMenu();
      }

      // subtitle panel — built regardless, CC button hides itself if empty
      const subtitlePanel = el('div', 'ws-panel');
      subtitlePanel.dataset.panel = 'subtitles';
      menu.appendChild(subtitlePanel);
      this._subtitlePanel = subtitlePanel;

      this._skin.appendChild(menu);
      this._menu = menu;
      this._settingsBtn = settingsBtn;
      this._pipBtn = pipBtn;
    }

    // -------------------------------------------------------------
    // Video element events
    // -------------------------------------------------------------
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
        this._playBtn.setAttribute('aria-label', 'Lecture');
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
    }

    // -------------------------------------------------------------
    // UI interactions
    // -------------------------------------------------------------
    _bindUIEvents() {
      const v = this._video;
      const toggle = () => (v.paused ? v.play() : v.pause());

      this._bigBtn.addEventListener('click', toggle);
      this._playBtn.addEventListener('click', toggle);
      this._skin.addEventListener('click', (e) => {
        if (e.target === this._skin || e.target === v) {
          toggle();
          this._showFlash(v.paused ? ICONS.pause : ICONS.play);
        }
      });
      this._skin.addEventListener('dblclick', () => this._toggleFullscreen());

      this._replayBtn.addEventListener('click', () => {
        v.currentTime = 0;
        this._replayBtn.style.display = 'none';
        v.play();
      });

      // progress scrubbing (+ chapter-aware tooltip)
      const seekFromEvent = (e) => {
        const rect = this._progressRow.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        return Math.min(1, Math.max(0, x / rect.width));
      };
      const chapterAt = (t) => {
        if (!this._chapters) return null;
        let current = null;
        for (const c of this._chapters) {
          if (c.time <= t) current = c; else break;
        }
        return current;
      };
      const applyScrubUI = (ratio) => {
        this._played.style.width = ratio * 100 + '%';
        this._handle.style.left = ratio * 100 + '%';
        this._tooltip.style.left = ratio * 100 + '%';
        const t = ratio * (v.duration || 0);
        const ch = chapterAt(t);
        this._tooltip.innerHTML = (ch ? `<span class="ws-tt-chapter">${ch.title}</span>` : '') + fmtTime(t);
      };
      this._progressRow.addEventListener('mousemove', (e) => {
        if (!v.duration) return;
        applyScrubUI(seekFromEvent(e));
      });
      const startScrub = (e) => {
        if (!v.duration) return;
        this._scrubbing = true;
        this._progressRow.classList.add('ws-scrubbing');
        applyScrubUI(seekFromEvent(e));
      };
      const moveScrub = (e) => {
        if (!this._scrubbing) return;
        applyScrubUI(seekFromEvent(e));
      };
      const endScrub = (e) => {
        if (!this._scrubbing) return;
        this._scrubbing = false;
        this._progressRow.classList.remove('ws-scrubbing');
        v.currentTime = seekFromEvent(e) * v.duration;
      };
      this._progressRow.addEventListener('mousedown', startScrub);
      window.addEventListener('mousemove', moveScrub);
      window.addEventListener('mouseup', endScrub);
      this._progressRow.addEventListener('touchstart', startScrub, { passive: true });
      this._progressRow.addEventListener('touchmove', moveScrub, { passive: true });
      this._progressRow.addEventListener('touchend', endScrub);
      this._progressRow.addEventListener('keydown', (e) => {
        if (!v.duration) return;
        if (e.key === 'ArrowRight') v.currentTime = Math.min(v.duration, v.currentTime + 5);
        if (e.key === 'ArrowLeft') v.currentTime = Math.max(0, v.currentTime - 5);
      });

      // chapter tick click-to-seek
      if (this._chapters) {
        this._track.querySelectorAll('.ws-chapter-tick').forEach((tick) => {
          tick.addEventListener('click', (e) => {
            e.stopPropagation();
            v.currentTime = parseFloat(tick.dataset.time);
          });
        });
      }

      // volume
      this._volBtn.addEventListener('click', () => {
        v.muted = !v.muted;
        if (!v.muted && v.volume === 0) v.volume = 0.5;
      });
      let volDragging = false;
      const applyVol = (e) => {
        const rect = this._volTrack.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const ratio = Math.min(1, Math.max(0, x / rect.width));
        v.volume = ratio;
        v.muted = ratio === 0;
      };
      this._volTrack.addEventListener('mousedown', (e) => { volDragging = true; applyVol(e); });
      window.addEventListener('mousemove', (e) => { if (volDragging) applyVol(e); });
      window.addEventListener('mouseup', () => (volDragging = false));
      this._volWrap.addEventListener('mouseenter', () => this._volWrap.classList.add('ws-vol-active'));
      this._volWrap.addEventListener('mouseleave', () => this._volWrap.classList.remove('ws-vol-active'));

      // settings menu
      this._settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._showPanel('root');
        this._menu.classList.toggle('ws-open');
      });
      // CC button: quick toggle if exactly one track, else open subtitle panel
      this._ccBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const list = this._video.textTracks;
        if (list.length === 1) {
          const showing = list[0].mode === 'showing';
          list[0].mode = showing ? 'disabled' : 'showing';
          this._ccBtn.classList.toggle('ws-btn-active', !showing);
          this._refreshSubtitleMenu();
          return;
        }
        this._refreshSubtitleMenu();
        this._showPanel('subtitles');
        this._menu.classList.add('ws-open');
      });
      document.addEventListener('click', () => this._menu.classList.remove('ws-open'));
      this._menu.addEventListener('click', (e) => e.stopPropagation());

      // pip
      this._pipBtn.addEventListener('click', async () => {
        try {
          if (document.pictureInPictureElement) await document.exitPictureInPicture();
          else await v.requestPictureInPicture();
        } catch (err) { /* PiP unsupported or blocked — silently ignore */ }
      });

      // fullscreen
      this._fsBtn.addEventListener('click', () => this._toggleFullscreen());
      document.addEventListener('fullscreenchange', () => {
        const isFs = document.fullscreenElement === this;
        this.setAttribute('data-fullscreen', String(isFs));
        this._fsBtn.innerHTML = isFs ? ICONS.fsExit : ICONS.fsEnter;
      });
    }

    _showFlash(iconHtml) {
      clearTimeout(this._flashTimer);
      this._flash.innerHTML = iconHtml;
      this._flash.classList.remove('ws-flash-show');
      // force reflow so the transition restarts on rapid toggles
      void this._flash.offsetWidth;
      this._flash.classList.add('ws-flash-show');
      this._flashTimer = setTimeout(() => this._flash.classList.remove('ws-flash-show'), 450);
    }

    // -------------------------------------------------------------
    // Keyboard shortcuts
    // -------------------------------------------------------------
    _bindKeyboard() {
      this.addEventListener('keydown', (e) => {
        const v = this._video;
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'k', 'f', 'm', 'c', '>', '<'];
        if (keys.includes(e.key)) e.preventDefault();
        switch (e.key) {
          case ' ':
          case 'k':
            v.paused ? v.play() : v.pause();
            this._showFlash(v.paused ? ICONS.play : ICONS.pause);
            break;
          case 'ArrowRight':
            v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
            this._showFlash('<svg viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>');
            break;
          case 'ArrowLeft':
            v.currentTime = Math.max(0, v.currentTime - 5);
            this._showFlash('<svg viewBox="0 0 24 24"><path d="M20 18V6l-8.5 6L20 18zM11 6v12L2.5 12 11 6z"/></svg>');
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
            this._showFlash(v.muted ? ICONS.volOff : ICONS.volHigh);
            break;
          case 'c':
            if (this._video.textTracks.length) this._ccBtn.click();
            break;
          case '>':
            if (this._rate < 2) {
              this._rate = Math.min(2, this._rate + 0.25);
              v.playbackRate = this._rate;
            }
            break;
          case '<':
            if (this._rate > 0.25) {
              this._rate = Math.max(0.25, this._rate - 0.25);
              v.playbackRate = this._rate;
            }
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
    }

    _scheduleHide(delay = 2600) {
      this._clearHide();
      this._hideTimer = setTimeout(() => {
        if (!this._video.paused && !this._scrubbing && !this._menu.classList.contains('ws-open')) {
          this.setAttribute('data-controls-hidden', 'true');
        }
      }, delay);
    }
    _clearHide() {
      if (this._hideTimer) clearTimeout(this._hideTimer);
      this.setAttribute('data-controls-hidden', 'false');
    }

    // -------------------------------------------------------------
    // Progress / buffered / volume sync
    // -------------------------------------------------------------
    _updateProgress() {
      const v = this._video;
      if (!v.duration || this._scrubbing) return;
      const ratio = v.currentTime / v.duration;
      this._played.style.width = ratio * 100 + '%';
      this._handle.style.left = ratio * 100 + '%';
      this._time.textContent = `${fmtTime(v.currentTime)} / ${fmtTime(v.duration)}`;
      if (v.currentTime > 0) this._replayBtn.style.display = 'none';

      if (this._chapters && this._chapterTitleEl) {
        let current = null;
        for (const c of this._chapters) {
          if (c.time <= v.currentTime) current = c; else break;
        }
        if (current && current.title !== this._lastChapterTitle) {
          this._lastChapterTitle = current.title;
          this._chapterTitleEl.textContent = current.title;
          this._chapterTitleEl.classList.add('ws-show');
          clearTimeout(this._chapterLabelTimer);
          this._chapterLabelTimer = setTimeout(() => this._chapterTitleEl.classList.remove('ws-show'), 2600);
        }
      }
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
      this._volBtn.setAttribute('aria-label', ratio === 0 ? 'Réactiver le son' : 'Muet');
    }

    _toggleFullscreen() {
      if (document.fullscreenElement === this) document.exitFullscreen();
      else if (this.requestFullscreen) this.requestFullscreen();
    }
  }

  customElements.define('video-player', VideoPlayer);
})();
