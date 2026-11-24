// nova-notification-center.ts — System notifications drawer connected to reactive state
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { appState, type NotificationItem } from '../state/app-state.js';

@customElement('nova-notification-center')
export class NovaNotificationCenter extends LitElement {
  static styles = css`
    :host {
      display: none;
      position: absolute;
      top: 48px;
      right: 16px;
      width: 360px;
      max-height: 520px;
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

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--nova-border, rgba(255,255,255,0.08));
    }
    .title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }
    .clear-btn {
      background: transparent;
      border: none;
      color: var(--nova-text-muted, rgba(255,255,255,0.4));
      cursor: pointer;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 4px;
      transition: all var(--nova-transition-fast);
    }
    .clear-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 400px;
      overflow-y: auto;
      padding-right: 2px;
    }
    .item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.06));
      border-radius: var(--nova-radius-sm, 6px);
      padding: 12px;
      transition: background var(--nova-transition-fast);
    }
    .item:hover {
      background: rgba(255, 255, 255, 0.06);
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .item-time {
      font-size: 11px;
      color: var(--nova-text-muted, rgba(255,255,255,0.4));
      font-weight: normal;
    }
    .item-msg {
      font-size: 12px;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
      line-height: 1.45;
    }
    .type-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 6px;
    }
    .type-info { background: #3b82f6; }
    .type-warn { background: #f59e0b; }
    .type-success { background: #10b981; }
  `;

  @property({ type: Boolean, reflect: true }) open = false;
  @state() private notifications: NotificationItem[] = [];

  private unsub?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this.notifications = appState.getNotifications();
    this.unsub = appState.subscribe('notifications', (items: NotificationItem[]) => {
      this.notifications = [...items];
      this.requestUpdate();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsub?.();
  }

  private clearAll() {
    appState.clearNotifications();
  }

  render() {
    if (!this.open) return html``;
    return html`
      <div class="header">
        <span class="title">System Notifications (${this.notifications.length})</span>
        <button class="clear-btn" @click=${this.clearAll} ?disabled=${this.notifications.length === 0}>Clear All</button>
      </div>
      <div class="list">
        ${this.notifications.length === 0 ? html`
          <div style="font-size:12px;color:var(--nova-text-muted);text-align:center;padding:36px 0;">
            No pending notifications
          </div>
        ` : this.notifications.map(n => html`
          <div class="item">
            <div class="item-header">
              <span>
                <span class="type-dot type-${n.type || 'info'}"></span>
                ${n.title}
              </span>
              <span class="item-time">${n.time}</span>
            </div>
            <div class="item-msg">${n.message}</div>
          </div>
        `)}
      </div>
    `;
  }
}
