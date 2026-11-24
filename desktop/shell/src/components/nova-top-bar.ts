// nova-top-bar.ts — Status bar / top panel with live telemetry and system tray
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './nova-notification-center.js';
import './nova-quick-settings.js';
import './nova-workspace-switcher.js';
import { novaApi, type SystemMetrics } from '../services/nova-api.js';
import { appState, type NotificationItem } from '../state/app-state.js';

@customElement('nova-top-bar')
export class NovaTopBar extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      height: 40px;
      background: var(--nova-bg-glass, rgba(15, 16, 33, 0.75));
      backdrop-filter: blur(28px) saturate(1.4);
      -webkit-backdrop-filter: blur(28px) saturate(1.4);
      border-bottom: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      font-family: var(--nova-font-ui, system-ui, sans-serif);
      user-select: none;
      box-sizing: border-box;
      z-index: 100;
    }

    .left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: var(--nova-radius-sm, 6px);
      cursor: pointer;
      transition: background var(--nova-transition-fast);
      border: none;
      background: transparent;
      color: #fff;
    }
    .logo-btn:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .logo-icon {
      width: 22px;
      height: 22px;
      background: var(--nova-accent-gradient, linear-gradient(135deg, #7c5af0, #3b82f6));
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      color: white;
      box-shadow: 0 2px 8px rgba(124, 90, 240, 0.4);
    }

    .logo-text {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }

    .center {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      padding: 4px 10px;
      border-radius: 6px;
      transition: background var(--nova-transition-fast);
    }
    .center:hover {
      background: rgba(255, 255, 255, 0.06);
    }

    .clock {
      font-size: 12px;
      font-weight: 600;
      color: var(--nova-text-primary, rgba(255,255,255,0.92));
      letter-spacing: 0.2px;
    }

    .right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .metrics-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 3px 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: 12px;
      font-size: 11px;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
    }

    .metric-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }

    .tray-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 5px 8px;
      border-radius: 6px;
      cursor: pointer;
      background: transparent;
      border: none;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
      font-size: 13px;
      transition: all var(--nova-transition-fast);
      position: relative;
    }
    .tray-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    .badge-dot {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 6px #ef4444;
    }
  `;

  @state() private timeString = '';
  @state() private notificationsOpen = false;
  @state() private quickSettingsOpen = false;
  @state() private notificationCount = 2;
  @state() private metrics: SystemMetrics | null = null;

  private timer = 0;
  private metricsTimer = 0;
  private unsubNotif?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this.updateClock();
    this.timer = window.setInterval(() => this.updateClock(), 1000);

    this.pollMetrics();
    this.metricsTimer = window.setInterval(() => this.pollMetrics(), 4000);

    this.unsubNotif = appState.subscribe('notifications', (items: NotificationItem[]) => {
      this.notificationCount = items.length;
      this.requestUpdate();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.timer);
    clearInterval(this.metricsTimer);
    this.unsubNotif?.();
  }

  private updateClock() {
    const now = new Date();
    this.timeString = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
      '  ' + now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  private async pollMetrics() {
    this.metrics = await novaApi.getSystemInfo();
    this.requestUpdate();
  }

  private toggleLauncher() {
    this.dispatchEvent(new CustomEvent('launcher-toggle', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="left">
        <button class="logo-btn" @click=${this.toggleLauncher} title="Application Launcher (Super key)">
          <div class="logo-icon">✦</div>
          <span class="logo-text">NOVA</span>
        </button>
        <nova-workspace-switcher></nova-workspace-switcher>
      </div>

      <div class="center" @click=${() => appState.openApp('settings')} title="System Date & Time">
        <span class="clock">${this.timeString}</span>
      </div>

      <div class="right">
        ${this.metrics ? html`
          <div class="metrics-pill" title="Live System Telemetry">
            <span class="metric-dot"></span>
            <span>CPU ${this.metrics.cpuPercent}%</span>
            <span>RAM ${Math.round(this.metrics.memoryUsedBytes / (1024 ** 3))}GB</span>
          </div>
        ` : ''}

        <button
          class="tray-btn"
          @click=${() => {
            this.notificationsOpen = !this.notificationsOpen;
            if (this.notificationsOpen) this.quickSettingsOpen = false;
          }}
          title="Notifications"
        >
          <span>🔔</span>
          ${this.notificationCount > 0 ? html`<span class="badge-dot"></span>` : ''}
        </button>

        <button
          class="tray-btn"
          @click=${() => {
            this.quickSettingsOpen = !this.quickSettingsOpen;
            if (this.quickSettingsOpen) this.notificationsOpen = false;
          }}
          title="Quick Settings"
        >
          <span>📶</span>
          <span>⚡</span>
        </button>

        <button
          class="tray-btn"
          @click=${() => appState.openApp('ai-assistant')}
          title="NOVA Intelligence (Super+A)"
        >
          <span>✨</span>
        </button>
      </div>

      ${this.notificationsOpen ? html`
        <nova-notification-center
          .open=${this.notificationsOpen}
          @close=${() => { this.notificationsOpen = false; }}
        ></nova-notification-center>
      ` : ''}

      ${this.quickSettingsOpen ? html`
        <nova-quick-settings
          .open=${this.quickSettingsOpen}
          @close=${() => { this.quickSettingsOpen = false; }}
        ></nova-quick-settings>
      ` : ''}
    `;
  }
}
