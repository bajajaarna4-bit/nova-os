// nova-files.ts — Real filesystem browsing file manager
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { novaApi, type FileItem } from '../services/nova-api.js';

@customElement('nova-files')
export class NovaFiles extends LitElement {
  static styles = css`
    :host {
      display: flex;
      height: 100%;
      background: var(--nova-bg-surface, #141628);
      color: var(--nova-text-primary, #fff);
      font-family: var(--nova-font-ui, system-ui, sans-serif);
      user-select: none;
    }
    .sidebar {
      width: 190px;
      border-right: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: rgba(10, 11, 20, 0.4);
    }
    .nav-header {
      font-size: 11px;
      font-weight: 700;
      color: var(--nova-text-muted, rgba(255,255,255,0.4));
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 8px;
    }
    .nav-item {
      padding: 8px 12px;
      border-radius: var(--nova-radius-sm, 6px);
      cursor: pointer;
      font-size: 13px;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all var(--nova-transition-fast);
    }
    .nav-item:hover, .nav-item.active {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      background: rgba(255, 255, 255, 0.02);
    }
    .nav-btn {
      background: transparent;
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: 4px;
      color: #fff;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 12px;
    }
    .nav-btn:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .path-bar {
      flex: 1;
      padding: 6px 10px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: 4px;
      font-size: 12px;
      font-family: var(--nova-font-mono, monospace);
      color: var(--nova-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .grid {
      flex: 1;
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 16px;
      align-content: start;
      overflow-y: auto;
    }
    .file-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px 8px;
      border-radius: var(--nova-radius-md, 12px);
      cursor: pointer;
      transition: background var(--nova-transition-fast);
      text-align: center;
    }
    .file-card:hover {
      background: rgba(255, 255, 255, 0.06);
    }
    .file-card.selected {
      background: rgba(124, 90, 240, 0.2);
      border: 1px solid rgba(124, 90, 240, 0.4);
    }
    .icon {
      font-size: 36px;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));
    }
    .name {
      font-size: 12px;
      word-break: break-word;
      line-height: 1.3;
      max-height: 32px;
      overflow: hidden;
    }
    .meta {
      font-size: 10px;
      color: var(--nova-text-muted);
    }
  `;

  @state() private currentPath = '';
  @state() private files: FileItem[] = [];
  @state() private selectedFile: string | null = null;
  @state() private history: string[] = [];

  async connectedCallback() {
    super.connectedCallback();
    await this.loadDirectory();
  }

  private async loadDirectory(targetPath?: string) {
    const res = await novaApi.listDirectory(targetPath);
    this.currentPath = res.path;
    this.files = res.items;
    this.selectedFile = null;
    this.requestUpdate();
  }

  private async openItem(item: FileItem) {
    if (item.isDirectory) {
      this.history.push(this.currentPath);
      const sep = this.currentPath.includes('\\') ? '\\' : '/';
      const nextPath = this.currentPath.endsWith(sep) ? `${this.currentPath}${item.name}` : `${this.currentPath}${sep}${item.name}`;
      await this.loadDirectory(nextPath);
    } else {
      this.selectedFile = item.name;
    }
  }

  private async goBack() {
    if (this.history.length > 0) {
      const prev = this.history.pop()!;
      await this.loadDirectory(prev);
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  render() {
    return html`
      <div class="sidebar">
        <div class="nav-header">Favorites</div>
        <div class="nav-item active" @click=${() => this.loadDirectory()}>
          <span>🏠</span> Home
        </div>
        <div class="nav-item" @click=${() => this.loadDirectory('docs')}>
          <span>📄</span> Documentation
        </div>
        <div class="nav-item" @click=${() => this.loadDirectory('crates')}>
          <span>📦</span> System Crates
        </div>
        <div class="nav-item" @click=${() => this.loadDirectory('desktop')}>
          <span>🖥️</span> Desktop Shell
        </div>

        <div class="nav-header" style="margin-top: 14px;">Zero-Trust Storage</div>
        <div class="nav-item" title="Concealed in user private sandbox">
          <span>🔒</span> Private Vault
        </div>
      </div>

      <div class="content-area">
        <div class="toolbar">
          <button class="nav-btn" @click=${this.goBack} ?disabled=${this.history.length === 0} title="Back">←</button>
          <div class="path-bar">${this.currentPath}</div>
          <button class="nav-btn" @click=${() => this.loadDirectory(this.currentPath)} title="Refresh">↻</button>
        </div>

        <div class="grid">
          ${this.files.map(item => html`
            <div
              class="file-card ${this.selectedFile === item.name ? 'selected' : ''}"
              @dblclick=${() => this.openItem(item)}
              @click=${() => { this.selectedFile = item.name; }}
            >
              <span class="icon">${item.isDirectory ? '📁' : '📄'}</span>
              <span class="name">${item.name}</span>
              <span class="meta">${item.isDirectory ? 'Directory' : this.formatSize(item.size)}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}
