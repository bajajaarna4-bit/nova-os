// nova-notification-center.ts — System notifications drawer
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type?: 'info' | 'warn' | 'success';
}

@customElement('nova-notification-center')
export class NovaNotificationCenter extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: absolute;
      top: 48px;
      right: 16px;
      width: 340px;
      max-height: 480px;
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
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--nova-border);
    }
    .title {
      font-size: 14px;
      font-weight: 600;
    }
    .clear-btn {
      background: none;
      border: none;
      color: var(--nova-text-muted);
      cursor: pointer;
      font-size: 12px;
    }
    .clear-btn:hover {
      color: var(--nova-text-primary);
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 380px;
      overflow-y: auto;
    }
    .item {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--nova-border);
      border-radius: var(--nova-radius-sm);
      padding: 10px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .item-time {
      font-size: 10px;
      color: var(--nova-text-muted);
    }
    .item-msg {
      font-size: 12px;
      color: var(--nova-text-secondary);
      line-height: 1.4;
    }
  `;

  @property({ type: Boolean }) open = false;

  @state() private notifications: NotificationItem[] = [
    {
      id: '1',
      title: 'SELinux Policy Enforcing',
      message: 'Zero-trust confinement active for all desktop services.',
      time: 'Just now',
      type: 'info',
    },
    {
      id: '2',
      title: 'NOVA Intelligence Ready',
      message: 'Private local model engine initialized.',
      time: '2m ago',
      type: 'success',
    },
  ];

  private clearAll() {
    this.notifications = [];
  }

  render() {
    if (!this.open) return html``;
    return html`
      <div class="header">
        <span class="title">Notifications</span>
        <button class="clear-btn" @click=${this.clearAll}>Clear All</button>
      </div>
      <div class="list">
        ${this.notifications.length === 0 ? html`
          <div style="font-size:12px;color:var(--nova-text-muted);text-align:center;padding:24px 0;">
            No new notifications
          </div>
        ` : this.notifications.map(n => html`
          <div class="item">
            <div class="item-header">
              <span>${n.title}</span>
              <span class="item-time">${n.time}</span>
            </div>
            <div class="item-msg">${n.message}</div>
          </div>
        `)}
      </div>
    `;
  }
}
