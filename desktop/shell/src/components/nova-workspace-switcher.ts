// nova-workspace-switcher.ts — Workspace pager & switcher with reactive appState integration
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { appState } from '../state/app-state.js';

@customElement('nova-workspace-switcher')
export class NovaWorkspaceSwitcher extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(255, 255, 255, 0.04);
      padding: 3px 6px;
      border-radius: var(--nova-radius-sm, 6px);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
    }
    .workspace-pill {
      min-width: 22px;
      height: 18px;
      border-radius: 4px;
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      color: var(--nova-text-secondary, rgba(255,255,255,0.6));
      transition: all var(--nova-transition-fast, 120ms cubic-bezier(0.4,0,0.2,1));
      padding: 0 4px;
    }
    .workspace-pill:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
    .workspace-pill.active {
      background: var(--nova-accent-violet, #7c5af0);
      color: #fff;
      box-shadow: 0 0 10px rgba(124, 90, 240, 0.4);
    }
  `;

  @state() private currentWorkspace = 1;
  private totalWorkspaces = 4;
  private unsub?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this.currentWorkspace = appState.getWorkspace();
    this.unsub = appState.subscribe('workspace', (ws: number) => {
      this.currentWorkspace = ws;
      this.requestUpdate();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsub?.();
  }

  private switchWorkspace(n: number) {
    appState.setWorkspace(n);
  }

  render() {
    return html`
      ${Array.from({ length: this.totalWorkspaces }).map((_, i) => {
        const num = i + 1;
        return html`
          <button
            class="workspace-pill ${num === this.currentWorkspace ? 'active' : ''}"
            @click=${() => this.switchWorkspace(num)}
            title="Switch to Workspace ${num} (Ctrl+Alt+${num})"
          >
            ${num}
          </button>
        `;
      })}
    `;
  }
}
