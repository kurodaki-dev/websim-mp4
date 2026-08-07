/*!
 * websim.mp3 — a single-file, dependency-free video player
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
 * No other files, no CSS link, no build step. Everything (styles, icons,
 * controls, keyboard shortcuts, big play button, scrubber, volume, time,
 * fullscreen, PiP, playback rate, settings menu) lives in this one script.
 */
(() => {
  'use strict';

  const NS = 'websim-mp3';
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
  // Styles — injected once, scoped by data attribute + shadow-less BEM
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
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity .1s ease;
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
}
.ws-btn:hover { opacity: 1; background: rgba(255,255,255,0.12); }
.ws-btn svg { width: 20px; height: 20px; fill: currentColor; }
.ws-btn:focus-visible, .ws-progress-row:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

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
  background: rgba(24,24,27,0.96);
  border-radius: 6px;
  padding: 6px 0;
  min-width: 150px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  display: none;
  flex-direction: column;
  z-index: 5;
  max-height: 220px;
  overflow-y: auto;
}
.ws-menu.ws-open { display: flex; }
.ws-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 14px;
  color: #eee;
  font-size: 12.5px;
  cursor: pointer;
  white-space: nowrap;
}
.ws-menu-item:hover { background: rgba(255,255,255,0.1); }
.ws-menu-item svg { width: 14px; height: 14px; fill: #e50914; visibility: hidden; }
.ws-menu-item[data-active="true"] svg { visibility: visible; }
.ws-menu-header {
  padding: 6px 14px;
  color: rgba(255,255,255,0.5);
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: .04em;
}

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
    }

    connectedCallback() {
      injectStyles();
      // Defer to next microtask so light-DOM children (video-skin/video) are parsed.
      if (this._built) return;
      this._built = true;
      // If the <video> isn't parsed yet (script executed mid-parse), wait a tick.
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

      this._buildUI();
      this._bindVideoEvents();
      this._bindUIEvents();
      this._bindKeyboard();
      this._bindIdleHide();
      this._syncVolumeUI();
    }

    _buildUI() {
      const label = el('div', 'ws-label', 'websim.mp3');
      this._skin.appendChild(label);

      // big play overlay
      const bigWrap = el('div', 'ws-big-play-wrap');
      const bigBtn = el('button', 'ws-overlay-btn', '');
      bigBtn.setAttribute('aria-label', 'Play');
      bigBtn.tabIndex = -1;
      const bigCircle = el('div', 'ws-big-play', ICONS.play);
      bigBtn.appendChild(bigCircle);
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
      progressRow.append(track, tooltip);
      controls.appendChild(progressRow);
      Object.assign(this, {
        _progressRow: progressRow, _buffered: buffered, _played: played,
        _handle: handle, _tooltip: tooltip,
      });

      // button bar
      const bar = el('div', 'ws-bar');

      const playBtn = el('button', 'ws-btn', ICONS.play);
      playBtn.setAttribute('aria-label', 'Play');
      this._playBtn = playBtn;

      const replayBtn = el('button', 'ws-btn', ICONS.replay);
      replayBtn.setAttribute('aria-label', 'Replay 10 seconds');
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

      const settingsBtn = el('button', 'ws-btn', ICONS.settings);
      settingsBtn.setAttribute('aria-label', 'Settings');

      const pipBtn = el('button', 'ws-btn', ICONS.pip);
      pipBtn.setAttribute('aria-label', 'Picture in picture');
      if (!('pictureInPictureEnabled' in document)) pipBtn.style.display = 'none';

      const fsBtn = el('button', 'ws-btn', ICONS.fsEnter);
      fsBtn.setAttribute('aria-label', 'Fullscreen');
      this._fsBtn = fsBtn;

      bar.append(playBtn, replayBtn, volWrap, time, spacer, rateBtn, settingsBtn, pipBtn, fsBtn);
      controls.appendChild(bar);
      this._skin.appendChild(controls);
      this._controls = controls;

      // rate menu
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

      this._settingsBtn = settingsBtn;
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

      // progress scrubbing
      const seekFromEvent = (e) => {
        const rect = this._progressRow.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        return Math.min(1, Math.max(0, x / rect.width));
      };
      const applyScrubUI = (ratio) => {
        this._played.style.width = ratio * 100 + '%';
        this._handle.style.left = ratio * 100 + '%';
        this._tooltip.style.left = ratio * 100 + '%';
        this._tooltip.textContent = fmtTime(ratio * (v.duration || 0));
      };
      this._progressRow.addEventListener('mousemove', (e) => {
        if (!v.duration) return;
        const ratio = seekFromEvent(e);
        this._tooltip.style.left = ratio * 100 + '%';
        this._tooltip.textContent = fmtTime(ratio * v.duration);
        if (this._scrubbing) applyScrubUI(ratio);
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

      // rate menu
      this._rateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._rateMenu.classList.toggle('ws-open');
      });
      this._settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._rateMenu.classList.toggle('ws-open');
      });
      this._rateMenu.addEventListener('click', (e) => {
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
      document.addEventListener('click', () => this._rateMenu.classList.remove('ws-open'));

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
    }

    _scheduleHide(delay = 2600) {
      this._clearHide();
      this._hideTimer = setTimeout(() => {
        if (!this._video.paused && !this._scrubbing) {
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
