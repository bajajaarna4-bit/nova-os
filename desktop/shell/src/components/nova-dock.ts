// nova-dock.ts — Application dock
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface DockApp {
  id: string;
  label: string;
  icon: string;
  color: string;
}

const DOCK_APPS: DockApp[] = [
  { id: 'terminal', label: 'Terminal', color: '#1a1a2e', icon: 'terminal' },
  { id: 'files', label: 'Files', color: '#1a2a1a', icon: 'files' },
  { id: 'browser', label: 'Browser', color: '#1a1a3a', icon: 'browser' },
  { id: 'ai-assistant', label: 'AI Assistant', color: '#1e1a2e', icon: 'ai' },
  { id: 'settings', label: 'Settings', color: '#2a1a1a', icon: 'settings' },
  { id: 'security', label: 'Security', color: '#1a2a2a', icon: 'security' },
];

@customElement('nova-dock')
export class NovaDock extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
    }

    .dock {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      padding: 8px 12px;
      background: var(--nova-bg-glass);
      backdrop-filter: blur(32px) saturate(1.5);
      -webkit-backdrop-filter: blur(32px) saturate(1.5);
      border: 1px solid var(--nova-border);
      border-radius: var(--nova-radius-xl);
      box-shadow: var(--nova-shadow-lg), inset 0 1px 0 rgba(255,255,255,0.08);
      animation: slideInUp 0.5s cubic-bezier(0.4,0,0.2,1) forwards;
    }

    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(60px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dock-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      position: relative;
    }

    .dock-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform var(--nova-transition-base), box-shadow var(--nova-transition-base);
      position: relative;
      overflow: hidden;
    }

    .dock-icon::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: rgba(255,255,255,0.05);
      transition: background var(--nova-transition-fast);
    }

    .dock-item:hover .dock-icon {
      transform: scale(1.15) translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.5);
    }

    .dock-item:hover .dock-icon::before {
      background: rgba(255,255,255,0.12);
    }

    .dock-item:active .dock-icon {
      transform: scale(1.0) translateY(0);
    }

    .dock-label {
      position: absolute;
      bottom: 56px;
      left: 50%;
      transform: translateX(-50%) scale(0.8);
      background: var(--nova-bg-elevated);
      border: 1px solid var(--nova-border);
      border-radius: var(--nova-radius-sm);
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 500;
      color: var(--nova-text-primary);
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--nova-transition-fast), transform var(--nova-transition-fast);
      box-shadow: var(--nova-shadow-sm);
    }

    .dock-item:hover .dock-label {
      opacity: 1;
      transform: translateX(-50%) scale(1);
    }

    .running-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--nova-accent-violet);
      opacity: 0;
      transition: opacity var(--nova-transition-fast);
    }

    .running-dot.active {
      opacity: 1;
    }

    .separator {
      width: 1px;
      height: 36px;
      background: var(--nova-border);
      margin: 0 4px;
      align-self: center;
    }

    svg {
      width: 26px;
      height: 26px;
      color: white;
    }
  `;

  @property({ type: Array }) openWindows: string[] = [];

  private renderIcon(type: string) {
    const icons: Record<string, ReturnType<typeof html>> = {
      terminal: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="4 17 10 11 4 5"/>
        <line x1="12" y1="19" x2="20" y2="19"/>
      </svg>`,
      files: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>`,
      browser: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>`,
      ai: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>`,
      settings: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>`,
      security: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>`,
    };
    return icons[type] ?? icons['files'];
  }

  private iconGradients: Record<string, string> = {
    terminal: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    files: 'linear-gradient(135deg, #1a2e1a, #0d2818)',
    browser: 'linear-gradient(135deg, #1a1a3e, #0d0d2e)',
    ai: 'linear-gradient(135deg, #2a1a3e, #1a0d2e)',
    settings: 'linear-gradient(135deg, #2e1a1a, #2a0d0d)',
    security: 'linear-gradient(135deg, #0d2a2a, #0a1f1f)',
  };

  private launchApp(id: string) {
    this.dispatchEvent(new CustomEvent('app-launch', {detail: {appId: id}, bubbles: true, composed: true}));
  }

  render() {
    return html`
      <div class="dock">
        ${DOCK_APPS.map((app, i) => html`
          ${i === 4 ? html`<div class="separator"></div>` : ''}
          <div class="dock-item" @click=${() => this.launchApp(app.id)}>
            <span class="dock-label">${app.label}</span>
            <div class="dock-icon" style="background: ${this.iconGradients[app.icon] || '#1a1a2e'}; border: 1px solid var(--nova-border);">
              ${this.renderIcon(app.icon)}
            </div>
            <div class="running-dot ${this.openWindows.includes(app.id) ? 'active' : ''}"></div>
          </div>
        `)}
      </div>
    `;
  }
}
