// nova-quick-settings.ts — Quick settings tray popup
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('nova-quick-settings')
export class NovaQuickSettings extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: absolute;
      top: 48px;
      right: 16px;
      width: 280px;
      background: var(--nova-bg-glass);
      backdrop-filter: blur(28px) saturate(1.4);
      -webkit-backdrop-filter: blur(28px) saturate(1.4);
      border: 1px solid var(--nova-border);
      border-radius: var(--nova-radius-md);
      box-shadow: var(--nova-shadow-lg);
      padding: 16px;
      z-index: 500;
      color: var(--nova-text-primary);
      font-family: var(--nova-font-ui);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--nova-border);
      border-radius: var(--nova-radius-sm);
      cursor: pointer;
      transition: all var(--nova-transition-fast);
      user-select: none;
    }
    .tile.active {
      background: var(--nova-accent-violet);
      color: #fff;
    }
    .icon {
      font-size: 18px;
    }
    .label {
      font-size: 11px;
      font-weight: 500;
    }
    .slider-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 10px;
    }
    .slider-label {
      font-size: 12px;
      color: var(--nova-text-secondary);
      width: 48px;
    }
    input[type="range"] {
      flex: 1;
      accent-color: var(--nova-accent-violet);
    }
  `;

  @property({ type: Boolean }) open = false;

  @state() private wifi = true;
  @state() private bluetooth = true;
  @state() private nightLight = false;
  @state() private volume = 75;

  render() {
    if (!this.open) return html``;
    return html`
      <div class="grid">
        <div class="tile ${this.wifi ? 'active' : ''}" @click=${() => { this.wifi = !this.wifi; }}>
          <span class="icon">📶</span>
          <span class="label">${this.wifi ? 'Wi-Fi: NovaNet' : 'Wi-Fi Off'}</span>
        </div>
        <div class="tile ${this.bluetooth ? 'active' : ''}" @click=${() => { this.bluetooth = !this.bluetooth; }}>
          <span class="icon">ᛒ</span>
          <span class="label">${this.bluetooth ? 'Bluetooth On' : 'Bluetooth Off'}</span>
        </div>
        <div class="tile ${this.nightLight ? 'active' : ''}" @click=${() => { this.nightLight = !this.nightLight; }}>
          <span class="icon">🌙</span>
          <span class="label">Night Light</span>
        </div>
        <div class="tile active">
          <span class="icon">🔒</span>
          <span class="label">Zero-Trust</span>
        </div>
      </div>
      <div class="slider-row">
        <span class="slider-label">Volume</span>
        <input
          type="range"
          min="0"
          max="100"
          .value=${this.volume}
          @input=${(e: any) => { this.volume = e.target.value; }}
        />
      </div>
    `;
  }
}
