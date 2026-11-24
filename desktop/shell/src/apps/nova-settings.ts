// nova-settings.ts — System settings panel
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('nova-settings')
export class NovaSettings extends LitElement {
  static styles = css`
    :host {
      display: flex;
      height: 100%;
      background: var(--nova-bg-surface);
      color: var(--nova-text-primary);
      font-family: var(--nova-font-ui);
    }
    .nav {
      width: 200px;
      border-right: 1px solid var(--nova-border);
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .nav-btn {
      padding: 10px 14px;
      border-radius: var(--nova-radius-sm);
      cursor: pointer;
      font-size: 13px;
      color: var(--nova-text-secondary);
      transition: all var(--nova-transition-fast);
    }
    .nav-btn:hover, .nav-btn.active {
      background: var(--nova-bg-hover);
      color: var(--nova-text-primary);
    }
    .content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }
    h2 {
      font-size: 18px;
      margin-bottom: 16px;
      font-weight: 600;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid var(--nova-border);
    }
    .label {
      font-size: 14px;
      font-weight: 500;
    }
    .sublabel {
      font-size: 12px;
      color: var(--nova-text-secondary);
      margin-top: 2px;
    }
    .badge {
      padding: 4px 10px;
      border-radius: var(--nova-radius-sm);
      background: rgba(124, 90, 240, 0.15);
      color: #9d84f5;
      font-size: 12px;
      font-weight: 600;
    }
  `;

  @state() private currentTab = 'general';

  render() {
    return html`
      <div class="nav">
        <div class="nav-btn ${this.currentTab === 'general' ? 'active' : ''}" @click=${() => { this.currentTab = 'general'; }}>⚙️ General</div>
        <div class="nav-btn ${this.currentTab === 'appearance' ? 'active' : ''}" @click=${() => { this.currentTab = 'appearance'; }}>🎨 Appearance</div>
        <div class="nav-btn ${this.currentTab === 'privacy' ? 'active' : ''}" @click=${() => { this.currentTab = 'privacy'; }}>🔒 Privacy</div>
        <div class="nav-btn ${this.currentTab === 'updates' ? 'active' : ''}" @click=${() => { this.currentTab = 'updates'; }}>🔄 Updates</div>
      </div>
      <div class="content">
        ${this.currentTab === 'general' ? html`
          <h2>System Overview</h2>
          <div class="row">
            <div>
              <div class="label">Operating System</div>
              <div class="sublabel">Atomic Linux Deployment</div>
            </div>
            <span class="badge">NOVA OS 0.1.0</span>
          </div>
          <div class="row">
            <div>
              <div class="label">Display Protocol</div>
              <div class="sublabel">High refresh rate compositor</div>
            </div>
            <span class="badge">Wayland Ready</span>
          </div>
        ` : ''}

        ${this.currentTab === 'appearance' ? html`
          <h2>Appearance & Accessibility</h2>
          <div class="row">
            <div>
              <div class="label">Theme Mode</div>
              <div class="sublabel">Deep midnight background with violet accents</div>
            </div>
            <span class="badge">Dark (Default)</span>
          </div>
          <div class="row">
            <div>
              <div class="label">Reduced Motion</div>
              <div class="sublabel">Disable glass spring animations</div>
            </div>
            <span class="badge">Standard</span>
          </div>
        ` : ''}

        ${this.currentTab === 'privacy' ? html`
          <h2>Privacy & Telemetry</h2>
          <div class="row">
            <div>
              <div class="label">Diagnostic Telemetry</div>
              <div class="sublabel">Zero remote tracking without explicit consent</div>
            </div>
            <span class="badge">Disabled</span>
          </div>
          <div class="row">
            <div>
              <div class="label">AI Cloud Sync</div>
              <div class="sublabel">Local-first inference default</div>
            </div>
            <span class="badge">Local Only</span>
          </div>
        ` : ''}

        ${this.currentTab === 'updates' ? html`
          <h2>System Updates</h2>
          <div class="row">
            <div>
              <div class="label">Deployment Status</div>
              <div class="sublabel">Managed by bootc / rpm-ostree</div>
            </div>
            <span class="badge">Up to Date</span>
          </div>
        ` : ''}
      </div>
    `;
  }
}
