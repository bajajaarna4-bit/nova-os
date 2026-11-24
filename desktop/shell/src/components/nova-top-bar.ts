// nova-top-bar.ts — Status bar / top panel
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './nova-notification-center.js';
import './nova-quick-settings.js';

@customElement('nova-top-bar')
export class NovaTopBar extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      height: 40px;
      background: var(--nova-bg-glass);
      backdrop-filter: blur(24px) saturate(1.4);
      -webkit-backdrop-filter: blur(24px) saturate(1.4);
      border-bottom: 1px solid var(--nova-border);
      font-family: var(--nova-font-ui);
      user-select: none;
    }

    .left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .logo-icon {
      width: 22px;
      height: 22px;
      background: var(--nova-accent-gradient);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: white;
    }

    .logo-text {
      font-size: 13px;
      font-weight: 600;
      background: var(--nova-accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .workspace-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--nova-text-secondary);
      padding: 3px 8px;
      background: var(--nova-bg-hover);
      border-radius: var(--nova-radius-sm);
      border: 1px solid var(--nova-border);
      cursor: pointer;
      transition: background var(--nova-transition-fast);
    }
    .workspace-indicator:hover {
      background: rgba(255,255,255,0.08);
    }

    .center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
    }

    .clock {
      font-size: 14px;
      font-weight: 500;
      color: var(--nova-text-primary);
      line-height: 1;
    }

    .date {
      font-size: 10px;
      color: var(--nova-text-secondary);
      line-height: 1;
      margin-top: 2px;
    }

    .right {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .tray-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: var(--nova-radius-sm);
      cursor: pointer;
      transition: background var(--nova-transition-fast);
      position: relative;
      color: var(--nova-text-secondary);
    }
    .tray-btn:hover {
      background: var(--nova-bg-hover);
      color: var(--nova-text-primary);
    }
    .tray-btn svg {
      width: 16px;
      height: 16px;
    }

    .notification-btn {
      position: relative;
    }

    .notif-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 14px;
      height: 14px;
      background: var(--nova-accent-violet);
      border-radius: 50%;
      font-size: 9px;
      font-weight: 600;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--nova-accent-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      color: white;
      cursor: pointer;
      margin-left: 4px;
    }

    .panel-container {
      position: fixed;
      top: 44px;
      z-index: 300;
    }

    .quick-settings-container {
      right: 8px;
    }

    .notification-container {
      right: 8px;
    }
  `;

  @state() private timeStr = '';
  @state() private dateStr = '';
  @state() private showNotifications = false;
  @state() private showQuickSettings = false;
  @state() private notifCount = 3;
  @state() private currentWorkspace = 1;

  private clockInterval = 0;

  connectedCallback() {
    super.connectedCallback();
    this.updateClock();
    this.clockInterval = window.setInterval(() => this.updateClock(), 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.clockInterval);
  }

  private updateClock() {
    const now = new Date();
    this.timeStr = now.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: true});
    this.dateStr = now.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'});
  }

  private toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) this.showQuickSettings = false;
  }

  private toggleQuickSettings() {
    this.showQuickSettings = !this.showQuickSettings;
    if (this.showQuickSettings) this.showNotifications = false;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.showNotifications = false;
      this.showQuickSettings = false;
    }
  }

  render() {
    return html`
      <div class="left">
        <div class="logo" @click=${() => this.dispatchEvent(new CustomEvent('launcher-toggle', {bubbles: true, composed: true}))}>
          <div class="logo-icon">N</div>
          <span class="logo-text">NOVA OS</span>
        </div>
        <div class="workspace-indicator">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="0" y="0" width="5" height="5" rx="1"/>
            <rect x="7" y="0" width="5" height="5" rx="1" opacity="0.4"/>
            <rect x="0" y="7" width="5" height="5" rx="1" opacity="0.4"/>
            <rect x="7" y="7" width="5" height="5" rx="1" opacity="0.4"/>
          </svg>
          WS ${this.currentWorkspace}
        </div>
      </div>

      <div class="center">
        <div class="clock">${this.timeStr}</div>
        <div class="date">${this.dateStr}</div>
      </div>

      <div class="right">
        <!-- Network -->
        <div class="tray-btn" title="Network: Connected">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <circle cx="12" cy="20" r="1" fill="currentColor"/>
          </svg>
        </div>

        <!-- Bluetooth -->
        <div class="tray-btn" title="Bluetooth: On">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/>
          </svg>
        </div>

        <!-- Volume -->
        <div class="tray-btn" title="Volume: 75%">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        </div>

        <!-- Battery -->
        <div class="tray-btn" title="Battery: 82%">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="6" width="18" height="12" rx="2" ry="2"/>
            <line x1="23" y1="13" x2="23" y2="11"/>
            <rect x="3" y="8" width="11" height="8" rx="1" fill="currentColor" opacity="0.7"/>
          </svg>
        </div>

        <!-- Notifications -->
        <div class="tray-btn notification-btn" title="Notifications" @click=${this.toggleNotifications}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          ${this.notifCount > 0 ? html`<span class="notif-badge">${this.notifCount}</span>` : ''}
        </div>

        <!-- Quick Settings -->
        <div class="tray-btn" title="Quick Settings" @click=${this.toggleQuickSettings}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </div>

        <div class="avatar" title="User menu">U</div>
      </div>

      ${this.showNotifications ? html`
        <div class="panel-container notification-container">
          <nova-notification-center
            @close=${() => { this.showNotifications = false; }}
          ></nova-notification-center>
        </div>
      ` : ''}

      ${this.showQuickSettings ? html`
        <div class="panel-container quick-settings-container">
          <nova-quick-settings
            @close=${() => { this.showQuickSettings = false; }}
          ></nova-quick-settings>
        </div>
      ` : ''}
    `;
  }
}
