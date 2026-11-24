// nova-desktop.ts — Root desktop environment component with workspace awareness and context menu
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './nova-top-bar.js';
import './nova-dock.js';
import './nova-launcher.js';
import './nova-window.js';
import './nova-workspace-switcher.js';
import { globalKeyboard } from '../utils/keyboard.js';
import { appState, type WindowInstance } from '../state/app-state.js';

@customElement('nova-desktop')
export class NovaDesktop extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      position: relative;
      background: var(--nova-bg-base, #0a0b14);
      font-family: var(--nova-font-ui, system-ui, sans-serif);
      user-select: none;
    }

    .desktop-bg {
      position: absolute;
      inset: 0;
      z-index: 0;
      background:
        radial-gradient(ellipse 80% 50% at 20% 10%, rgba(124,90,240,0.18) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 85%, rgba(59,130,246,0.14) 0%, transparent 55%),
        radial-gradient(ellipse 50% 60% at 50% 50%, rgba(6,182,212,0.06) 0%, transparent 70%),
        #0a0b14;
      transition: background 0.4s ease;
    }

    canvas.particles {
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
    }

    .desktop-icons {
      position: absolute;
      top: 56px;
      left: 24px;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .desktop-shortcut {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      width: 76px;
      padding: 8px 4px;
      border-radius: var(--nova-radius-md, 12px);
      cursor: pointer;
      color: #fff;
      transition: all var(--nova-transition-fast, 120ms);
    }
    .desktop-shortcut:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-2px);
    }
    .desktop-shortcut .icon {
      font-size: 32px;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
    }
    .desktop-shortcut .label {
      font-size: 11px;
      font-weight: 500;
      text-align: center;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
      color: rgba(255, 255, 255, 0.9);
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
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
    }

    nova-launcher {
      position: absolute;
      inset: 0;
      z-index: 250;
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

    /* Desktop Context Menu */
    .context-menu {
      position: absolute;
      z-index: 400;
      background: rgba(20, 22, 40, 0.92);
      backdrop-filter: blur(24px) saturate(1.4);
      -webkit-backdrop-filter: blur(24px) saturate(1.4);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.1));
      border-radius: var(--nova-radius-md, 12px);
      box-shadow: 0 16px 36px rgba(0,0,0,0.6);
      padding: 6px;
      min-width: 190px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      color: #fff;
      font-size: 13px;
    }
    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      color: rgba(255,255,255,0.8);
      transition: all var(--nova-transition-fast);
    }
    .menu-item:hover {
      background: var(--nova-accent-violet, #7c5af0);
      color: #fff;
    }
    .menu-separator {
      height: 1px;
      background: var(--nova-border, rgba(255,255,255,0.08));
      margin: 4px 6px;
    }
  `;

  @state() private launcherOpen = false;
  @state() private windows: WindowInstance[] = [];
  @state() private currentWorkspace = 1;
  @state() private contextMenu: { visible: boolean; x: number; y: number } = { visible: false, x: 0, y: 0 };
  @state() private particles: Array<{ x: number; y: number; vx: number; vy: number; r: number; a: number }> = [];

  private animFrame = 0;
  private unsubs: Array<() => void> = [];

  connectedCallback() {
    super.connectedCallback();
    this.initParticles();
    this.setupKeyboard();

    this.currentWorkspace = appState.getWorkspace();
    this.windows = [...appState.getWindows()];

    this.unsubs.push(
      appState.subscribe('windows', (wins: WindowInstance[]) => {
        this.windows = [...wins];
        this.requestUpdate();
      })
    );

    this.unsubs.push(
      appState.subscribe('workspace', (ws: number) => {
        this.currentWorkspace = ws;
        this.requestUpdate();
      })
    );

    // Initial default windows to showcase working desktop
    setTimeout(() => {
      appState.openApp('terminal');
    }, 400);
    setTimeout(() => {
      appState.openApp('ai-assistant');
    }, 700);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this.animFrame);
    globalKeyboard.destroy();
    this.unsubs.forEach(fn => fn());
  }

  private setupKeyboard() {
    globalKeyboard.register('Super', () => { this.launcherOpen = !this.launcherOpen; });
    globalKeyboard.register('Escape', () => {
      if (this.launcherOpen) this.launcherOpen = false;
      if (this.contextMenu.visible) this.contextMenu = { visible: false, x: 0, y: 0 };
    });
    globalKeyboard.register('Super+t', () => appState.openApp('terminal'));
    globalKeyboard.register('Super+f', () => appState.openApp('files'));
    globalKeyboard.register('Super+a', () => appState.openApp('ai-assistant'));
    globalKeyboard.register('Super+s', () => appState.openApp('settings'));
    globalKeyboard.register('Super+1', () => appState.setWorkspace(1));
    globalKeyboard.register('Super+2', () => appState.setWorkspace(2));
    globalKeyboard.register('Super+3', () => appState.setWorkspace(3));
    globalKeyboard.register('Super+4', () => appState.setWorkspace(4));
  }

  private initParticles() {
    const count = 75;
    this.particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.4,
      a: Math.random() * 0.45 + 0.1,
    }));
  }

  private startParticleLoop(canvas: HTMLCanvasElement) {
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
        ctx.fillStyle = `rgba(180, 190, 255, ${p.a})`;
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

  private handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    this.contextMenu = {
      visible: true,
      x: Math.min(window.innerWidth - 200, e.clientX),
      y: Math.min(window.innerHeight - 200, e.clientY),
    };
  }

  private handleDesktopClick() {
    if (this.contextMenu.visible) {
      this.contextMenu = { visible: false, x: 0, y: 0 };
    }
  }

  render() {
    const visibleWindows = this.windows.filter(w => !w.minimized && w.workspace === this.currentWorkspace);

    return html`
      <div class="desktop-bg" @contextmenu=${this.handleContextMenu} @click=${this.handleDesktopClick}></div>
      <canvas class="particles"></canvas>

      <!-- Desktop shortcuts -->
      <div class="desktop-icons">
        <div class="desktop-shortcut" @dblclick=${() => appState.openApp('files')}>
          <span class="icon">📁</span>
          <span class="label">Files</span>
        </div>
        <div class="desktop-shortcut" @dblclick=${() => appState.openApp('terminal')}>
          <span class="icon">⚡</span>
          <span class="label">Terminal</span>
        </div>
        <div class="desktop-shortcut" @dblclick=${() => appState.openApp('security')}>
          <span class="icon">🛡️</span>
          <span class="label">Security</span>
        </div>
      </div>

      <nova-top-bar
        @launcher-toggle=${() => { this.launcherOpen = !this.launcherOpen; }}
      ></nova-top-bar>

      <div class="windows-layer">
        ${visibleWindows.map(win => html`
          <nova-window
            .windowData=${win}
            @window-focus=${(e: CustomEvent) => appState.focusWindow(e.detail.windowId)}
            @window-close=${(e: CustomEvent) => appState.closeWindow(e.detail.windowId)}
            @window-minimize=${(e: CustomEvent) => appState.minimizeWindow(e.detail.windowId)}
            @window-maximize=${(e: CustomEvent) => appState.maximizeWindow(e.detail.windowId)}
          ></nova-window>
        `)}
      </div>

      <nova-dock
        .openWindows=${this.windows.map(w => w.appId)}
        @app-launch=${(e: CustomEvent) => appState.openApp(e.detail.appId)}
      ></nova-dock>

      ${this.launcherOpen ? html`
        <nova-launcher
          @app-launch=${(e: CustomEvent) => {
            this.launcherOpen = false;
            appState.openApp(e.detail.appId);
          }}
          @launcher-close=${() => { this.launcherOpen = false; }}
        ></nova-launcher>
      ` : ''}

      ${this.contextMenu.visible ? html`
        <div class="context-menu" style="left:${this.contextMenu.x}px;top:${this.contextMenu.y}px;">
          <div class="menu-item" @click=${() => { this.contextMenu.visible = false; appState.openApp('terminal'); }}>
            <span>⚡</span> Open Terminal
          </div>
          <div class="menu-item" @click=${() => { this.contextMenu.visible = false; appState.openApp('files'); }}>
            <span>📁</span> Browse Files
          </div>
          <div class="menu-separator"></div>
          <div class="menu-item" @click=${() => { this.contextMenu.visible = false; appState.openApp('settings'); }}>
            <span>⚙️</span> Display Settings
          </div>
          <div class="menu-item" @click=${() => { this.contextMenu.visible = false; appState.openApp('security'); }}>
            <span>🛡️</span> Security Center
          </div>
        </div>
      ` : ''}
    `;
  }
}
