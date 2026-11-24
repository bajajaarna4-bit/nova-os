// nova-window.ts — Window frame component with drag, resize, and snapping
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { appState, type WindowInstance } from '../state/app-state.js';
import '../apps/nova-terminal.js';
import '../apps/nova-files.js';
import '../apps/nova-settings.js';
import '../apps/nova-security-center.js';
import '../apps/nova-ai-assistant.js';

@customElement('nova-window')
export class NovaWindow extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: absolute;
    }

    .window {
      position: absolute;
      display: flex;
      flex-direction: column;
      background: var(--nova-bg-glass, rgba(15, 16, 33, 0.72));
      backdrop-filter: blur(32px) saturate(1.4);
      -webkit-backdrop-filter: blur(32px) saturate(1.4);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: var(--nova-radius-lg, 20px);
      box-shadow: var(--nova-shadow-lg, 0 24px 64px rgba(0,0,0,0.6)), inset 0 1px 0 rgba(255,255,255,0.08);
      overflow: hidden;
      min-width: 340px;
      min-height: 260px;
      transition: border-color var(--nova-transition-fast), box-shadow var(--nova-transition-fast);
      animation: windowOpen 0.22s cubic-bezier(0.4,0,0.2,1) forwards;
    }

    @keyframes windowOpen {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    .window.focused {
      border-color: var(--nova-border-accent, rgba(124,90,240,0.5));
      box-shadow: var(--nova-shadow-lg, 0 24px 64px rgba(0,0,0,0.6)), 0 0 0 1px rgba(124,90,240,0.25), inset 0 1px 0 rgba(255,255,255,0.12);
    }

    .window.maximized {
      border-radius: 0 !important;
      border: none;
    }

    .title-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      cursor: grab;
      user-select: none;
      flex-shrink: 0;
    }

    .title-bar:active {
      cursor: grabbing;
    }

    .window-controls {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .ctrl-btn {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      transition: filter var(--nova-transition-fast), transform var(--nova-transition-fast);
      position: relative;
    }
    .ctrl-btn:hover { filter: brightness(1.3); transform: scale(1.15); }
    .ctrl-btn:active { transform: scale(0.9); }

    .btn-close { background: #ff5f57; }
    .btn-minimize { background: #febc2e; }
    .btn-maximize { background: #28c840; }

    .title-text {
      flex: 1;
      font-size: 13px;
      font-weight: 600;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.2px;
    }

    .snap-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .snap-btn {
      background: transparent;
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: 4px;
      color: var(--nova-text-muted, rgba(255,255,255,0.4));
      cursor: pointer;
      font-size: 10px;
      padding: 2px 5px;
      transition: all var(--nova-transition-fast);
    }
    .snap-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    .window-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: rgba(10, 11, 20, 0.85);
    }

    .resize-handle {
      position: absolute;
      z-index: 10;
    }
    .resize-n  { top: 0; left: 8px; right: 8px; height: 6px; cursor: n-resize; }
    .resize-s  { bottom: 0; left: 8px; right: 8px; height: 6px; cursor: s-resize; }
    .resize-e  { top: 8px; bottom: 8px; right: 0; width: 6px; cursor: e-resize; }
    .resize-w  { top: 8px; bottom: 8px; left: 0; width: 6px; cursor: w-resize; }
    .resize-ne { top: 0; right: 0; width: 12px; height: 12px; cursor: ne-resize; }
    .resize-nw { top: 0; left: 0; width: 12px; height: 12px; cursor: nw-resize; }
    .resize-se { bottom: 0; right: 0; width: 12px; height: 12px; cursor: se-resize; }
    .resize-sw { bottom: 0; left: 0; width: 12px; height: 12px; cursor: sw-resize; }
  `;

  @property({ type: Object }) windowData!: WindowInstance;

  @state() private x = 120;
  @state() private y = 80;
  @state() private w = 700;
  @state() private h = 480;
  @state() private maximized = false;
  private prevGeom = { x: 120, y: 80, w: 700, h: 480 };

  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private isResizing = false;
  private resizeDir = '';
  private resizeStart = { x: 0, y: 0, w: 0, h: 0, mx: 0, my: 0 };

  connectedCallback() {
    super.connectedCallback();
    if (this.windowData) {
      this.x = this.windowData.x;
      this.y = this.windowData.y;
      this.w = this.windowData.w;
      this.h = this.windowData.h;
    }
  }

  private startDrag(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('.window-controls') || (e.target as HTMLElement).closest('.snap-actions')) return;
    this.isDragging = true;
    this.dragOffset = { x: e.clientX - this.x, y: e.clientY - this.y };
    this.focusWindow();

    const onMove = (ev: MouseEvent) => {
      if (!this.isDragging) return;
      this.x = Math.max(0, Math.min(window.innerWidth - 100, ev.clientX - this.dragOffset.x));
      this.y = Math.max(40, Math.min(window.innerHeight - 80, ev.clientY - this.dragOffset.y));
      this.requestUpdate();
    };

    const onUp = () => {
      this.isDragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  private startResize(e: MouseEvent, dir: string) {
    e.stopPropagation();
    this.isResizing = true;
    this.resizeDir = dir;
    this.resizeStart = { x: this.x, y: this.y, w: this.w, h: this.h, mx: e.clientX, my: e.clientY };
    this.focusWindow();

    const onMove = (ev: MouseEvent) => {
      if (!this.isResizing) return;
      const dx = ev.clientX - this.resizeStart.mx;
      const dy = ev.clientY - this.resizeStart.my;

      if (this.resizeDir.includes('e')) this.w = Math.max(340, this.resizeStart.w + dx);
      if (this.resizeDir.includes('s')) this.h = Math.max(260, this.resizeStart.h + dy);
      if (this.resizeDir.includes('w')) {
        const newW = Math.max(340, this.resizeStart.w - dx);
        this.x = this.resizeStart.x + (this.resizeStart.w - newW);
        this.w = newW;
      }
      if (this.resizeDir.includes('n')) {
        const newH = Math.max(260, this.resizeStart.h - dy);
        this.y = Math.max(40, this.resizeStart.y + (this.resizeStart.h - newH));
        this.h = newH;
      }
      this.requestUpdate();
    };

    const onUp = () => {
      this.isResizing = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  private focusWindow() {
    this.dispatchEvent(new CustomEvent('window-focus', { detail: { windowId: this.windowData.windowId }, bubbles: true, composed: true }));
  }

  private closeWindow() {
    this.dispatchEvent(new CustomEvent('window-close', { detail: { windowId: this.windowData.windowId }, bubbles: true, composed: true }));
  }

  private minimizeWindow() {
    this.dispatchEvent(new CustomEvent('window-minimize', { detail: { windowId: this.windowData.windowId }, bubbles: true, composed: true }));
  }

  private toggleMaximize() {
    if (!this.maximized) {
      this.prevGeom = { x: this.x, y: this.y, w: this.w, h: this.h };
      this.x = 0;
      this.y = 40;
      this.w = window.innerWidth;
      this.h = window.innerHeight - 40 - 72;
      this.maximized = true;
    } else {
      ({ x: this.x, y: this.y, w: this.w, h: this.h } = this.prevGeom);
      this.maximized = false;
    }
    this.dispatchEvent(new CustomEvent('window-maximize', { detail: { windowId: this.windowData.windowId }, bubbles: true, composed: true }));
    this.requestUpdate();
  }

  private snap(side: 'left' | 'right') {
    appState.snapWindow(this.windowData.windowId, side);
    this.w = Math.floor(window.innerWidth / 2);
    this.h = window.innerHeight - 40 - 72;
    this.y = 40;
    this.x = side === 'left' ? 0 : Math.floor(window.innerWidth / 2);
    this.maximized = false;
    this.requestUpdate();
  }

  private renderContent() {
    const id = this.windowData?.appId;
    if (id === 'terminal') return html`<nova-terminal></nova-terminal>`;
    if (id === 'files') return html`<nova-files></nova-files>`;
    if (id === 'settings') return html`<nova-settings></nova-settings>`;
    if (id === 'security') return html`<nova-security-center></nova-security-center>`;
    if (id === 'ai-assistant') return html`<nova-ai-assistant></nova-ai-assistant>`;
    return html`<div style="padding:24px;color:var(--nova-text-muted);font-size:14px;">Application: ${id}</div>`;
  }

  render() {
    const style = `left:${this.x}px;top:${this.y}px;width:${this.w}px;height:${this.h}px;z-index:${this.windowData?.zIndex ?? 10}`;
    const isFocused = this.windowData?.focused;

    return html`
      <div class="window ${isFocused ? 'focused' : ''} ${this.maximized ? 'maximized' : ''}"
           style=${style}
           @mousedown=${this.focusWindow}>

        <div class="resize-handle resize-n" @mousedown=${(e: MouseEvent) => this.startResize(e, 'n')}></div>
        <div class="resize-handle resize-s" @mousedown=${(e: MouseEvent) => this.startResize(e, 's')}></div>
        <div class="resize-handle resize-e" @mousedown=${(e: MouseEvent) => this.startResize(e, 'e')}></div>
        <div class="resize-handle resize-w" @mousedown=${(e: MouseEvent) => this.startResize(e, 'w')}></div>
        <div class="resize-handle resize-ne" @mousedown=${(e: MouseEvent) => this.startResize(e, 'ne')}></div>
        <div class="resize-handle resize-nw" @mousedown=${(e: MouseEvent) => this.startResize(e, 'nw')}></div>
        <div class="resize-handle resize-se" @mousedown=${(e: MouseEvent) => this.startResize(e, 'se')}></div>
        <div class="resize-handle resize-sw" @mousedown=${(e: MouseEvent) => this.startResize(e, 'sw')}></div>

        <div class="title-bar" @mousedown=${this.startDrag} @dblclick=${this.toggleMaximize}>
          <div class="window-controls">
            <button class="ctrl-btn btn-close" @click=${this.closeWindow} title="Close window"></button>
            <button class="ctrl-btn btn-minimize" @click=${this.minimizeWindow} title="Minimize window"></button>
            <button class="ctrl-btn btn-maximize" @click=${this.toggleMaximize} title="Maximize window"></button>
          </div>
          <span class="title-text">${this.windowData?.title ?? 'Window'}</span>
          <div class="snap-actions">
            <button class="snap-btn" @click=${() => this.snap('left')} title="Snap Left (Win+Left)">◧</button>
            <button class="snap-btn" @click=${() => this.snap('right')} title="Snap Right (Win+Right)">◨</button>
          </div>
        </div>

        <div class="window-content">
          ${this.renderContent()}
        </div>
      </div>
    `;
  }
}
