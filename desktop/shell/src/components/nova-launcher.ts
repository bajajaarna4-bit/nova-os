// nova-launcher.ts — Application launcher (Super key)
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface AppEntry {
  id: string;
  name: string;
  description: string;
  category: 'System' | 'Utilities' | 'Development' | 'Creative';
  icon: string;
  color: string;
}

const ALL_APPS: AppEntry[] = [
  { id: 'terminal', name: 'Terminal', description: 'Command-line interface', category: 'System', icon: 'terminal', color: '#1a1a2e' },
  { id: 'files', name: 'Files', description: 'Browse your filesystem', category: 'System', icon: 'files', color: '#1a2e1a' },
  { id: 'settings', name: 'Settings', description: 'Configure NOVA OS', category: 'System', icon: 'settings', color: '#2e1a1a' },
  { id: 'security', name: 'Security Center', description: 'Monitor system security', category: 'System', icon: 'security', color: '#0d2a2a' },
  { id: 'ai-assistant', name: 'AI Assistant', description: 'Powered by Gemini', category: 'Utilities', icon: 'ai', color: '#2a1a3e' },
  { id: 'browser', name: 'Web Browser', description: 'Browse the internet', category: 'Utilities', icon: 'browser', color: '#1a1a3e' },
  { id: 'text-editor', name: 'Text Editor', description: 'Edit plain text files', category: 'Development', icon: 'editor', color: '#1e2a1a' },
  { id: 'code-editor', name: 'Code Editor', description: 'Write code with syntax highlighting', category: 'Development', icon: 'code', color: '#0d1a2e' },
];

const CATEGORIES = ['System', 'Utilities', 'Development', 'Creative'];

@customElement('nova-launcher')
export class NovaLauncher extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 200;
      animation: fadeIn 0.18s ease forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .backdrop {
      position: absolute;
      inset: 0;
      background: rgba(5, 6, 15, 0.82);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    .launcher-panel {
      position: absolute;
      top: 10%;
      left: 50%;
      transform: translateX(-50%);
      width: 760px;
      max-width: 95vw;
      max-height: 75vh;
      background: var(--nova-bg-elevated);
      border: 1px solid var(--nova-border);
      border-radius: var(--nova-radius-xl);
      box-shadow: var(--nova-shadow-lg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: scaleIn 0.2s cubic-bezier(0.4,0,0.2,1) forwards;
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: translateX(-50%) scale(0.96); }
      to { opacity: 1; transform: translateX(-50%) scale(1); }
    }

    .search-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--nova-border);
    }

    .search-icon {
      color: var(--nova-text-muted);
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-size: 16px;
      font-family: var(--nova-font-ui);
      color: var(--nova-text-primary);
      caret-color: var(--nova-accent-violet);
    }
    .search-input::placeholder {
      color: var(--nova-text-muted);
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
    }

    .section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--nova-text-muted);
      margin-bottom: 10px;
      margin-top: 16px;
    }
    .section-label:first-child {
      margin-top: 0;
    }

    .apps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 8px;
    }

    .app-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      padding: 14px;
      border-radius: var(--nova-radius-md);
      border: 1px solid transparent;
      cursor: pointer;
      transition: background var(--nova-transition-fast), border-color var(--nova-transition-fast), transform var(--nova-transition-fast);
      background: transparent;
    }
    .app-card:hover, .app-card.focused {
      background: var(--nova-bg-hover);
      border-color: var(--nova-border-accent);
      transform: translateY(-1px);
    }
    .app-card:active {
      transform: scale(0.97);
    }

    .app-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--nova-border);
    }

    .app-icon svg {
      width: 22px;
      height: 22px;
      color: white;
    }

    .app-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--nova-text-primary);
      line-height: 1.2;
    }

    .app-desc {
      font-size: 11px;
      color: var(--nova-text-secondary);
      line-height: 1.3;
    }

    .recent-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .recent-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid var(--nova-border);
      background: var(--nova-bg-hover);
      cursor: pointer;
      font-size: 13px;
      color: var(--nova-text-secondary);
      transition: color var(--nova-transition-fast), border-color var(--nova-transition-fast);
    }
    .recent-pill:hover {
      color: var(--nova-text-primary);
      border-color: var(--nova-border-accent);
    }

    .kbd-hint {
      font-size: 11px;
      color: var(--nova-text-muted);
      text-align: center;
      padding: 10px;
      border-top: 1px solid var(--nova-border);
    }
    .kbd {
      display: inline-block;
      background: var(--nova-bg-hover);
      border: 1px solid var(--nova-border);
      border-radius: 4px;
      padding: 2px 6px;
      font-family: var(--nova-font-mono);
      font-size: 10px;
    }
  `;

  @state() private query = '';
  @state() private focusedIndex = 0;

  private recentApps = ['terminal', 'ai-assistant', 'files'];

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this.handleKey);
    // Auto-focus search
    setTimeout(() => this.shadowRoot?.querySelector<HTMLInputElement>('.search-input')?.focus(), 50);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.handleKey);
  }

  private handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.dispatchEvent(new CustomEvent('launcher-close', {bubbles: true, composed: true}));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.focusedIndex = (this.focusedIndex + 1) % this.filteredApps.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.focusedIndex = (this.focusedIndex - 1 + this.filteredApps.length) % this.filteredApps.length;
    } else if (e.key === 'Enter') {
      const app = this.filteredApps[this.focusedIndex];
      if (app) this.launchApp(app.id);
    }
  };

  private get filteredApps(): AppEntry[] {
    if (!this.query.trim()) return ALL_APPS;
    const q = this.query.toLowerCase();
    return ALL_APPS.filter(a =>
      a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }

  private launchApp(id: string) {
    this.dispatchEvent(new CustomEvent('app-launch', {detail: {appId: id}, bubbles: true, composed: true}));
  }

  private renderIcon(type: string) {
    const icons: Record<string, ReturnType<typeof html>> = {
      terminal: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
      files: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
      settings: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>`,
      security: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      ai: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
      browser: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
      editor: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
      code: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    };
    return icons[type] ?? icons['files'];
  }

  private iconGradients: Record<string, string> = {
    terminal: '#1a1a2e', files: '#1a2e1a', settings: '#2e1a1a',
    security: '#0d2a2a', ai: '#2a1a3e', browser: '#1a1a3e',
    editor: '#1e2a1a', code: '#0d1a2e',
  };

  private renderAppsForCategory(category: string) {
    const apps = this.filteredApps.filter(a => a.category === category);
    if (apps.length === 0) return '';
    return html`
      <div class="section-label">${category}</div>
      <div class="apps-grid">
        ${apps.map((app, i) => {
          const globalIdx = this.filteredApps.indexOf(app);
          return html`
            <div class="app-card ${globalIdx === this.focusedIndex ? 'focused' : ''}"
                 @click=${() => this.launchApp(app.id)}>
              <div class="app-icon" style="background: ${this.iconGradients[app.icon] || '#1a1a2e'}">
                ${this.renderIcon(app.icon)}
              </div>
              <div>
                <div class="app-name">${app.name}</div>
                <div class="app-desc">${app.description}</div>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  render() {
    const recentAppData = this.recentApps
      .map(id => ALL_APPS.find(a => a.id === id))
      .filter(Boolean) as AppEntry[];

    return html`
      <div class="backdrop" @click=${() => this.dispatchEvent(new CustomEvent('launcher-close', {bubbles:true,composed:true}))}></div>
      <div class="launcher-panel" @click=${(e: Event) => e.stopPropagation()}>
        <div class="search-row">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            class="search-input"
            type="text"
            placeholder="Search applications..."
            .value=${this.query}
            @input=${(e: InputEvent) => { this.query = (e.target as HTMLInputElement).value; this.focusedIndex = 0; }}
          />
        </div>

        <div class="content">
          ${!this.query.trim() ? html`
            <div class="section-label">Recent</div>
            <div class="recent-row">
              ${recentAppData.map(app => html`
                <div class="recent-pill" @click=${() => this.launchApp(app.id)}>
                  ${this.renderIcon(app.icon)} ${app.name}
                </div>
              `)}
            </div>
            ${CATEGORIES.map(cat => this.renderAppsForCategory(cat))}
          ` : html`
            ${this.filteredApps.length === 0
              ? html`<div style="color: var(--nova-text-muted); text-align: center; padding: 48px 0;">No apps found for "${this.query}"</div>`
              : html`<div class="apps-grid">
                  ${this.filteredApps.map((app, i) => html`
                    <div class="app-card ${i === this.focusedIndex ? 'focused' : ''}"
                         @click=${() => this.launchApp(app.id)}>
                      <div class="app-icon" style="background: ${this.iconGradients[app.icon] || '#1a1a2e'}">
                        ${this.renderIcon(app.icon)}
                      </div>
                      <div>
                        <div class="app-name">${app.name}</div>
                        <div class="app-desc">${app.description}</div>
                      </div>
                    </div>
                  `)}
                </div>`
            }
          `}
        </div>

        <div class="kbd-hint">
          <span class="kbd">↑↓</span> navigate &nbsp; <span class="kbd">↵</span> open &nbsp; <span class="kbd">Esc</span> close
        </div>
      </div>
    `;
  }
}
