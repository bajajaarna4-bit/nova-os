// nova-files.ts — Local file manager component
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('nova-files')
export class NovaFiles extends LitElement {
  static styles = css`
    :host {
      display: flex;
      height: 100%;
      background: var(--nova-bg-surface);
      color: var(--nova-text-primary);
      font-family: var(--nova-font-ui);
    }
    .sidebar {
      width: 180px;
      border-right: 1px solid var(--nova-border);
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .nav-item {
      padding: 8px 12px;
      border-radius: var(--nova-radius-sm);
      cursor: pointer;
      font-size: 13px;
      color: var(--nova-text-secondary);
      transition: all var(--nova-transition-fast);
    }
    .nav-item:hover, .nav-item.active {
      background: var(--nova-bg-hover);
      color: var(--nova-text-primary);
    }
    .main {
      flex: 1;
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 16px;
      align-content: start;
    }
    .file-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: var(--nova-radius-md);
      cursor: pointer;
      transition: background var(--nova-transition-fast);
    }
    .file-card:hover {
      background: var(--nova-bg-hover);
    }
    .icon {
      font-size: 32px;
    }
    .name {
      font-size: 12px;
      text-align: center;
      word-break: break-word;
    }
  `;

  @state() private currentFolder = 'Home';

  private files = [
    { name: 'Documents', type: 'folder', icon: '📁' },
    { name: 'Projects', type: 'folder', icon: '📁' },
    { name: 'Downloads', type: 'folder', icon: '📥' },
    { name: 'ARCHITECTURE.md', type: 'file', icon: '📄' },
    { name: 'nova-manifest.json', type: 'file', icon: '⚙️' },
  ];

  render() {
    return html`
      <div class="sidebar">
        <div class="nav-item active" @click=${() => { this.currentFolder = 'Home'; }}>🏠 Home</div>
        <div class="nav-item" @click=${() => { this.currentFolder = 'Documents'; }}>📄 Documents</div>
        <div class="nav-item" @click=${() => { this.currentFolder = 'Downloads'; }}>📥 Downloads</div>
        <div class="nav-item" @click=${() => { this.currentFolder = 'Security Vault'; }}>🔒 Vault</div>
      </div>
      <div class="main">
        ${this.files.map(f => html`
          <div class="file-card">
            <span class="icon">${f.icon}</span>
            <span class="name">${f.name}</span>
          </div>
        `)}
      </div>
    `;
  }
}
