// nova-desktop.ts — Root desktop component
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './nova-top-bar.js';
import './nova-dock.js';
import './nova-launcher.js';
import './nova-window.js';
import './nova-workspace-switcher.js';
import { globalKeyboard } from '../utils/keyboard.js';
import { appState, type WindowInstance } from '../state/app-state.js';
import { novaApi } from '../services/nova-api.js';

@customElement('nova-desktop')
export class NovaDesktop extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      position: relative;
      background: var(--nova-bg-base);
      font-family: var(--nova-font-ui);
    }

    .desktop-bg {
      position: absolute;
      inset: 0;
      z-index: 0;
      background:
        radial-gradient(ellipse 80% 50% at 20% 10%, rgba(124,90,240,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 80%, rgba(59,130,246,0.10) 0%, transparent 55%),
        radial-gradient(ellipse 50% 60% at 50% 50%, rgba(6,182,212,0.05) 0%, transparent 70%),
        #0a0b14;
    }

    canvas.particles {
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
    }

    .desktop-canvas {
      position: absolute;
      inset: 40px 0 72px 0;
      z-index: 2;
    }

    nova-top-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 40px;
      z-index: 100;
    }

    nova-dock {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
    }

    nova-launcher {
      position: absolute;
      inset: 0;
      z-index: 200;
    }

    .windows-layer {
      position: absolute;
      inset: 40px 0 72px 0;
      z-index: 50;
      pointer-events: none;
    }

    .windows-layer > * {
      pointer-events: all;
    }
  `;

  @state() private launcherOpen = false;
  @state() private windows: WindowInstance[] = [];
  @state() private particles: Array<{x:number;y:number;vx:number;vy:number;r:number;a:number}> = [];

  private canvas: HTMLCanvasElement | null = null;
  private animFrame = 0;

  connectedCallback() {
    super.connectedCallback();
    this.initParticles();
    this.setupKeyboard();
    appState.subscribe('windows', (wins: WindowInstance[]) => {
      this.windows = [...wins];
    });
    // Open terminal and AI assistant on start to demonstrate UI
    setTimeout(() => appState.openApp('terminal'), 500);
    setTimeout(() => appState.openApp('ai-assistant'), 800);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this.animFrame);
    globalKeyboard.destroy();
  }

  private setupKeyboard() {
    globalKeyboard.register('Super', () => { this.launcherOpen = !this.launcherOpen; });
    globalKeyboard.register('Escape', () => { if (this.launcherOpen) this.launcherOpen = false; });
    globalKeyboard.register('Super+t', () => appState.openApp('terminal'));
    globalKeyboard.register('Super+f', () => appState.openApp('files'));
    globalKeyboard.register('Super+a', () => appState.openApp('ai-assistant'));
    globalKeyboard.register('Super+s', () => appState.openApp('settings'));
  }

  private initParticles() {
    const count = 80;
    this.particles = Array.from({length: count}, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random() * 0.5 + 0.1,
    }));
  }

  private startParticleLoop(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.a})`;
        ctx.fill();
      }
      this.animFrame = requestAnimationFrame(draw);
    };
    draw();
  }

  firstUpdated() {
    const canvas = this.shadowRoot?.querySelector('canvas.particles') as HTMLCanvasElement;
    if (canvas) this.startParticleLoop(canvas);
  }

  private handleAppLaunch(e: CustomEvent) {
    this.launcherOpen = false;
    appState.openApp(e.detail.appId);
  }

  private handleWindowFocus(e: CustomEvent) {
    appState.focusWindow(e.detail.windowId);
    this.windows = [...appState.getWindows()];
  }

  private handleWindowClose(e: CustomEvent) {
    appState.closeWindow(e.detail.windowId);
  }

  render() {
    return html`
      <div class="desktop-bg"></div>
      <canvas class="particles"></canvas>

      <nova-top-bar
        @launcher-toggle=${() => { this.launcherOpen = !this.launcherOpen; }}
      ></nova-top-bar>

      <div class="windows-layer">
        ${this.windows.filter(w => !w.minimized).map(win => html`
          <nova-window
            .windowData=${win}
            @window-focus=${this.handleWindowFocus}
            @window-close=${this.handleWindowClose}
            @window-minimize=${(e: CustomEvent) => appState.minimizeWindow(e.detail.windowId)}
            @window-maximize=${(e: CustomEvent) => appState.maximizeWindow(e.detail.windowId)}
          ></nova-window>
        `)}
      </div>

      <div class="desktop-canvas"></div>

      <nova-dock
        .openWindows=${this.windows.map(w => w.appId)}
        @app-launch=${(e: CustomEvent) => appState.openApp(e.detail.appId)}
      ></nova-dock>

      ${this.launcherOpen ? html`
        <nova-launcher
          @app-launch=${this.handleAppLaunch}
          @launcher-close=${() => { this.launcherOpen = false; }}
        ></nova-launcher>
      ` : ''}
    `;
  }
}
