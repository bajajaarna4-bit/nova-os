// nova-window.ts — Window frame component
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { WindowInstance } from '../state/app-state.js';
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
      background: var(--nova-bg-glass);
      backdrop-filter: blur(32px) saturate(1.4);
      -webkit-backdrop-filter: blur(32px) saturate(1.4);
      border: 1px solid var(--nova-border);
      border-radius: var(--nova-radius-lg);
      box-shadow: var(--nova-shadow-lg), inset 0 1px 0 rgba(255,255,255,0.06);
      overflow: hidden;
      min-width: 320px;
      min-height: 240px;
      transition: box-shadow var(--nova-transition-fast);
      animation: windowOpen 0.22s cubic-bezier(0.4,0,0.2,1) forwards;
    }

    @keyframes windowOpen {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    .window.focused {
      border-color: var(--nova-border-accent);
      box-shadow: var(--nova-shadow-lg), 0 0 0 1px rgba(124,90,240,0.2), inset 0 1px 0 rgba(255,255,255,0.08);
    }

    .window.maximized {
      border-radius: 0 !important;
    }

    .title-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(255,255,255,0.03);
      border-bottom: 1px solid var(--nova-border);
      cursor: grab;
      user-select: none;
      flex-shrink: 0;
    }

    .title-bar:active {
      cursor: grabbing;
    }

    .title-text {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
      color: var(--nova-text-secondary);
      text-align: center;
    }

    .window-controls {
      display: flex;
      align-items: center;
      gap: 6px;
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
    .ctrl-btn:hover { filter: brightness(1.3); transform: scale(1.1); }
    .ctrl-btn:active { transform: scale(0.9); }

    .btn-close { background: #ff5f57; }
    .btn-minimize { background: #febc2e; }
    .btn-maximize { background: #28c840; }

    .window-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Resize handles */
    .resize-handle {
      position: absolute;
      z-index: 10;
    }
    .resize-n  { top: -4px; left: 8px; right: 8px; height: 8px; cursor: n-resize; }
    .resize-s  { bottom: -4px; left: 8px; right: 8px; height: 8px; cursor: s-resize; }
    .resize-e  { right: -4px; top: 8px; bottom: 8px; width: 8px; cursor: e-resize; }
    .resize-w  { left: -4px; top: 8px; bottom: 8px; width: 8px; cursor: w-resize; }
    .resize-ne { top: -4px; right: -4px; width: 12px; height: 12px; cursor: ne-resize; }
    .resize-nw { top: -4px; left: -4px; width: 12px; height: 12px; cursor: nw-resize; }
    .resize-se { bottom: -4px; right: -4px; width: 12px; height: 12px; cursor: se-resize; }
    .resize-sw { bottom: -4px; left: -4px; width: 12px; height: 12px; cursor: sw-resize; }
  `;

  @property({ type: Object }) windowData!: WindowInstance;

  @state() private x = 100;
  @state() private y = 60;
  @state() private w = 800;
  @state() private h = 540;
  @state() private maximized = false;
  @state() private prevGeom = {x:100,y:60,w:800,h:540};

  private dragging = false;
  private dragOffX = 0;
  private dragOffY = 0;

  private resizing = false;
  private resizeDir = '';
  private resizeStartX = 0;
  private resizeStartY = 0;
  private resizeStartGeom = {x:0,y:0,w:0,h:0};

  connectedCallback() {
    super.connectedCallback();
    // Stagger initial position per window
    const offset = (parseInt(this.windowData?.windowId?.slice(-4) || '0', 16) % 6) * 30;
    this.x = 80 + offset;
    this.y = 50 + offset;
    this.w = this.windowData?.appId === 'terminal' ? 720 : 860;
    this.h = this.windowData?.appId === 'terminal' ? 480 : 560;

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  private startDrag(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('ctrl-btn')) return;
    if (this.maximized) return;
    this.dragging = true;
    this.dragOffX = e.clientX - this.x;
    this.dragOffY = e.clientY - this.y;
    this.focusWindow();
  }

  private startResize(e: MouseEvent, dir: string) {
    this.resizing = true;
    this.resizeDir = dir;
    this.resizeStartX = e.clientX;
    this.resizeStartY = e.clientY;
    this.resizeStartGeom = {x: this.x, y: this.y, w: this.w, h: this.h};
    e.preventDefault();
    e.stopPropagation();
  }

  private onMouseMove = (e: MouseEvent) => {
    if (this.dragging) {
      this.x = Math.max(0, e.clientX - this.dragOffX);
      this.y = Math.max(40, e.clientY - this.dragOffY);
      this.updateWindowStyle();
    } else if (this.resizing) {
      const dx = e.clientX - this.resizeStartX;
      const dy = e.clientY - this.resizeStartY;
      const g = {...this.resizeStartGeom};
      if (this.resizeDir.includes('e')) { this.w = Math.max(320, g.w + dx); }
      if (this.resizeDir.includes('s')) { this.h = Math.max(240, g.h + dy); }
      if (this.resizeDir.includes('w')) { this.x = g.x + dx; this.w = Math.max(320, g.w - dx); }
      if (this.resizeDir.includes('n')) { this.y = g.y + dy; this.h = Math.max(240, g.h - dy); }
      this.updateWindowStyle();
    }
  };

  private onMouseUp = () => {
    this.dragging = false;
    this.resizing = false;
  };

  private updateWindowStyle() {
    const win = this.shadowRoot?.querySelector('.window') as HTMLElement;
    if (win) {
      win.style.left = `${this.x}px`;
      win.style.top = `${this.y}px`;
      win.style.width = `${this.w}px`;
      win.style.height = `${this.h}px`;
    }
  }

  private focusWindow() {
    this.dispatchEvent(new CustomEvent('window-focus', {detail: {windowId: this.windowData.windowId}, bubbles: true, composed: true}));
  }

  private closeWindow() {
    this.dispatchEvent(new CustomEvent('window-close', {detail: {windowId: this.windowData.windowId}, bubbles: true, composed: true}));
  }

  private minimizeWindow() {
    this.dispatchEvent(new CustomEvent('window-minimize', {detail: {windowId: this.windowData.windowId}, bubbles: true, composed: true}));
  }

  private toggleMaximize() {
    if (!this.maximized) {
      this.prevGeom = {x: this.x, y: this.y, w: this.w, h: this.h};
      this.x = 0; this.y = 0;
      this.w = window.innerWidth; this.h = window.innerHeight - 40 - 72;
      this.maximized = true;
    } else {
      ({x: this.x, y: this.y, w: this.w, h: this.h} = this.prevGeom);
      this.maximized = false;
    }
    this.dispatchEvent(new CustomEvent('window-maximize', {detail: {windowId: this.windowData.windowId}, bubbles: true, composed: true}));
    this.requestUpdate();
  }

  private renderContent() {
    const id = this.windowData?.appId;
    if (id === 'terminal') return html`<nova-terminal></nova-terminal>`;
    if (id === 'files') return html`<nova-files></nova-files>`;
    if (id === 'settings') return html`<nova-settings></nova-settings>`;
    if (id === 'security') return html`<nova-security-center></nova-security-center>`;
    if (id === 'ai-assistant') return html`<nova-ai-assistant></nova-ai-assistant>`;
    return html`<div style="padding:24px;color:var(--nova-text-muted);font-size:14px;">App not found: ${id}</div>`;
  }

  render() {
    const style = `left:${this.x}px;top:${this.y}px;width:${this.w}px;height:${this.h}px`;
    const isFocused = this.windowData?.focused;
    return html`
      <div class="window ${isFocused ? 'focused' : ''} ${this.maximized ? 'maximized' : ''}"
           style=${style}
           @mousedown=${this.focusWindow}>

        <!-- Resize handles -->
        <div class="resize-handle resize-n" @mousedown=${(e:MouseEvent) => this.startResize(e,'n')}></div>
        <div class="resize-handle resize-s" @mousedown=${(e:MouseEvent) => this.startResize(e,'s')}></div>
        <div class="resize-handle resize-e" @mousedown=${(e:MouseEvent) => this.startResize(e,'e')}></div>
        <div class="resize-handle resize-w" @mousedown=${(e:MouseEvent) => this.startResize(e,'w')}></div>
        <div class="resize-handle resize-ne" @mousedown=${(e:MouseEvent) => this.startResize(e,'ne')}></div>
        <div class="resize-handle resize-nw" @mousedown=${(e:MouseEvent) => this.startResize(e,'nw')}></div>
        <div class="resize-handle resize-se" @mousedown=${(e:MouseEvent) => this.startResize(e,'se')}></div>
        <div class="resize-handle resize-sw" @mousedown=${(e:MouseEvent) => this.startResize(e,'sw')}></div>

        <div class="title-bar" @mousedown=${this.startDrag} @dblclick=${this.toggleMaximize}>
          <div class="window-controls">
            <button class="ctrl-btn btn-close" @click=${this.closeWindow} title="Close"></button>
            <button class="ctrl-btn btn-minimize" @click=${this.minimizeWindow} title="Minimize"></button>
            <button class="ctrl-btn btn-maximize" @click=${this.toggleMaximize} title="Maximize"></button>
          </div>
          <span class="title-text">${this.windowData?.title ?? 'Window'}</span>
        </div>

        <div class="window-content">
          ${this.renderContent()}
        </div>
      </div>
    `;
  }
}
