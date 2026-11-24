// nova-workspace-switcher.ts — Workspace pager & switcher
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('nova-workspace-switcher')
export class NovaWorkspaceSwitcher extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .workspace-pill {
      width: 24px;
      height: 18px;
      border-radius: var(--nova-radius-sm);
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--nova-border);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
      color: var(--nova-text-secondary);
      transition: all var(--nova-transition-fast);
    }
    .workspace-pill.active {
      background: var(--nova-accent-violet);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.4);
      box-shadow: 0 0 10px rgba(124, 90, 240, 0.5);
    }
  `;

  @state() private activeIndex = 0;
  private totalWorkspaces = 4;

  render() {
    return html`
      ${Array.from({ length: this.totalWorkspaces }).map((_, i) => html`
        <div
          class="workspace-pill ${i === this.activeIndex ? 'active' : ''}"
          @click=${() => { this.activeIndex = i; }}
        >
          ${i + 1}
        </div>
      `)}
    `;
  }
}
