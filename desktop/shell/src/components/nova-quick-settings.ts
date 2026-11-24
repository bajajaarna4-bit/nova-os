// nova-quick-settings.ts — Quick settings tray popup with interactive controls
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { appState } from '../state/app-state.js';

@customElement('nova-quick-settings')
export class NovaQuickSettings extends LitElement {
  static styles = css`
    :host {
      display: none;
      position: absolute;
      top: 48px;
      right: 16px;
      width: 310px;
      background: var(--nova-bg-glass, rgba(15, 16, 33, 0.85));
      backdrop-filter: blur(32px) saturate(1.5);
      -webkit-backdrop-filter: blur(32px) saturate(1.5);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: var(--nova-radius-md, 12px);
      box-shadow: var(--nova-shadow-lg, 0 24px 64px rgba(0,0,0,0.6));
      padding: 18px;
      z-index: 500;
      color: var(--nova-text-primary, #fff);
      font-family: var(--nova-font-ui, system-ui, sans-serif);
      animation: dropDown 0.18s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      box-sizing: border-box;
    }

    @keyframes dropDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    :host([open]) {
      display: block;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 12px 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.06));
      border-radius: var(--nova-radius-sm, 6px);
      cursor: pointer;
      transition: all var(--nova-transition-fast);
      user-select: none;
    }
    .tile:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .tile.active {
      background: var(--nova-accent-violet, #7c5af0);
      color: #fff;
      box-shadow: 0 4px 14px rgba(124, 90, 240, 0.35);
    }
    .icon {
      font-size: 20px;
    }
    .label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: -0.2px;
    }
    .slider-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px 0;
      border-top: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-bottom: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      margin-bottom: 14px;
    }
    .slider-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .slider-icon {
      font-size: 14px;
      color: var(--nova-text-secondary);
      width: 20px;
      text-align: center;
    }
    input[type="range"] {
      flex: 1;
      accent-color: var(--nova-accent-violet, #7c5af0);
      cursor: pointer;
    }
    .actions-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .action-btn {
      flex: 1;
      padding: 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: 6px;
      color: var(--nova-text-secondary, rgba(255,255,255,0.8));
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all var(--nova-transition-fast);
    }
    .action-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
  `;

  @property({ type: Boolean, reflect: true }) open = false;

  @state() private wifi = true;
  @state() private bluetooth = true;
  @state() private nightLight = false;
  @state() private zeroTrust = true;
  @state() private volume = 80;
  @state() private brightness = 95;

  private toggleNightLight() {
    this.nightLight = !this.nightLight;
    document.body.style.filter = this.nightLight ? 'sepia(0.25) contrast(0.95)' : 'none';
  }

  private handlePowerAction(action: string) {
    appState.pushNotification({
      title: `System ${action}`,
      message: `Simulated system ${action.toLowerCase()} request. Audited in audit.jsonl`,
      type: 'info',
    });
  }

  render() {
    if (!this.open) return html``;
    return html`
      <div class="grid">
        <div class="tile ${this.wifi ? 'active' : ''}" @click=${() => { this.wifi = !this.wifi; }}>
          <span class="icon">📶</span>
          <span class="label">${this.wifi ? 'Wi-Fi: Connected' : 'Wi-Fi: Off'}</span>
        </div>
        <div class="tile ${this.bluetooth ? 'active' : ''}" @click=${() => { this.bluetooth = !this.bluetooth; }}>
          <span class="icon">ᛒ</span>
          <span class="label">${this.bluetooth ? 'Bluetooth On' : 'Bluetooth Off'}</span>
        </div>
        <div class="tile ${this.nightLight ? 'active' : ''}" @click=${this.toggleNightLight}>
          <span class="icon">🌙</span>
          <span class="label">Night Light</span>
        </div>
        <div class="tile ${this.zeroTrust ? 'active' : ''}" @click=${() => { this.zeroTrust = !this.zeroTrust; }}>
          <span class="icon">🛡️</span>
          <span class="label">Zero-Trust</span>
        </div>
      </div>

      <div class="slider-group">
        <div class="slider-row">
          <span class="slider-icon">🔊</span>
          <input
            type="range"
            min="0"
            max="100"
            .value=${this.volume}
            @input=${(e: any) => { this.volume = e.target.value; }}
            title="Volume: ${this.volume}%"
          />
        </div>
        <div class="slider-row">
          <span class="slider-icon">☀️</span>
          <input
            type="range"
            min="20"
            max="100"
            .value=${this.brightness}
            @input=${(e: any) => { this.brightness = e.target.value; }}
            title="Brightness: ${this.brightness}%"
          />
        </div>
      </div>

      <div class="actions-row">
        <button class="action-btn" @click=${() => appState.openApp('settings')}>
          <span>⚙️</span> Settings
        </button>
        <button class="action-btn" @click=${() => this.handlePowerAction('Lock')}>
          <span>🔒</span> Lock
        </button>
        <button class="action-btn" @click=${() => this.handlePowerAction('Restart')}>
          <span>🔄</span> Restart
        </button>
      </div>
    `;
  }
}
