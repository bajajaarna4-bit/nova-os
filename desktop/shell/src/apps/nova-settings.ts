// nova-settings.ts — Comprehensive system settings panel
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { novaApi, type SystemMetrics } from '../services/nova-api.js';
import { appState } from '../state/app-state.js';

@customElement('nova-settings')
export class NovaSettings extends LitElement {
  static styles = css`
    :host {
      display: flex;
      height: 100%;
      background: var(--nova-bg-surface, #141628);
      color: var(--nova-text-primary, #fff);
      font-family: var(--nova-font-ui, system-ui, sans-serif);
      user-select: none;
    }
    .nav {
      width: 210px;
      border-right: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      padding: 16px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: rgba(10, 11, 20, 0.4);
    }
    .nav-btn {
      padding: 10px 14px;
      border-radius: var(--nova-radius-sm, 6px);
      cursor: pointer;
      font-size: 13px;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all var(--nova-transition-fast);
      border: none;
      background: transparent;
      text-align: left;
    }
    .nav-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
    }
    .nav-btn.active {
      background: var(--nova-accent-violet, #7c5af0);
      color: #fff;
      font-weight: 600;
    }
    .content {
      flex: 1;
      padding: 24px 32px;
      overflow-y: auto;
    }
    h2 {
      font-size: 20px;
      margin-bottom: 20px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }
    .section-desc {
      font-size: 13px;
      color: var(--nova-text-secondary);
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .setting-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: var(--nova-radius-md, 12px);
      margin-bottom: 16px;
      overflow: hidden;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      border-bottom: 1px solid var(--nova-border, rgba(255,255,255,0.06));
    }
    .row:last-child {
      border-bottom: none;
    }
    .label {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }
    .sublabel {
      font-size: 12px;
      color: var(--nova-text-secondary);
      margin-top: 2px;
    }
    .badge {
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(124, 90, 240, 0.15);
      color: #a78bfa;
      font-size: 12px;
      font-weight: 600;
    }

    /* Interactive toggle switch */
    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(255, 255, 255, 0.15);
      transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 24px;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 50%;
    }
    input:checked + .slider {
      background-color: var(--nova-accent-violet, #7c5af0);
    }
    input:checked + .slider:before {
      transform: translateX(20px);
    }

    .color-picker {
      display: flex;
      gap: 10px;
    }
    .color-swatch {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid transparent;
      transition: transform var(--nova-transition-fast);
    }
    .color-swatch:hover {
      transform: scale(1.15);
    }
    .color-swatch.active {
      border-color: #fff;
    }
  `;

  @state() private currentTab = 'appearance';
  @state() private systemMetrics: SystemMetrics | null = null;
  @state() private highContrast = false;
  @state() private reducedMotion = false;
  @state() private activeAccent = '#7c5af0';

  // Permission toggles state
  @state() private permTerminalFiles = true;
  @state() private permTerminalNet = true;
  @state() private permAssistantSystem = true;
  @state() private permAssistantFiles = true;

  async connectedCallback() {
    super.connectedCallback();
    this.systemMetrics = await novaApi.getSystemInfo();
    this.permTerminalFiles = novaApi.isPermissionGranted('terminal', 'files');
    this.permTerminalNet = novaApi.isPermissionGranted('terminal', 'network');
    this.permAssistantSystem = novaApi.isPermissionGranted('ai-assistant', 'system');
    this.permAssistantFiles = novaApi.isPermissionGranted('ai-assistant', 'files');
  }

  private togglePermission(appId: string, perm: string, granted: boolean) {
    if (granted) {
      novaApi.grantPermission(appId, perm);
      appState.pushNotification({
        title: 'Permission Granted',
        message: `Granted "${perm}" access to ${appId}. Audited in audit.jsonl`,
        type: 'success',
      });
    } else {
      novaApi.revokePermission(appId, perm);
      appState.pushNotification({
        title: 'Permission Revoked',
        message: `Revoked "${perm}" access from ${appId}. Audited in audit.jsonl`,
        type: 'warn',
      });
    }
  }

  render() {
    return html`
      <div class="nav">
        <button class="nav-btn ${this.currentTab === 'appearance' ? 'active' : ''}" @click=${() => { this.currentTab = 'appearance'; }}>
          <span>🎨</span> Appearance
        </button>
        <button class="nav-btn ${this.currentTab === 'privacy' ? 'active' : ''}" @click=${() => { this.currentTab = 'privacy'; }}>
          <span>🔒</span> Privacy & Permissions
        </button>
        <button class="nav-btn ${this.currentTab === 'ai' ? 'active' : ''}" @click=${() => { this.currentTab = 'ai'; }}>
          <span>✨</span> Intelligence
        </button>
        <button class="nav-btn ${this.currentTab === 'a11y' ? 'active' : ''}" @click=${() => { this.currentTab = 'a11y'; }}>
          <span>♿</span> Accessibility
        </button>
        <button class="nav-btn ${this.currentTab === 'about' ? 'active' : ''}" @click=${() => { this.currentTab = 'about'; }}>
          <span>ℹ️</span> About System
        </button>
      </div>

      <div class="content">
        ${this.currentTab === 'appearance' ? html`
          <h2>Appearance & Styling</h2>
          <div class="section-desc">Customize the visual theme, accent colors, and desktop lighting.</div>

          <div class="setting-card">
            <div class="row">
              <div>
                <div class="label">Accent Color</div>
                <div class="sublabel">System-wide highlights and focus rings</div>
              </div>
              <div class="color-picker">
                <div class="color-swatch ${this.activeAccent === '#7c5af0' ? 'active' : ''}" style="background:#7c5af0" @click=${() => { this.activeAccent = '#7c5af0'; }}></div>
                <div class="color-swatch ${this.activeAccent === '#3b82f6' ? 'active' : ''}" style="background:#3b82f6" @click=${() => { this.activeAccent = '#3b82f6'; }}></div>
                <div class="color-swatch ${this.activeAccent === '#10b981' ? 'active' : ''}" style="background:#10b981" @click=${() => { this.activeAccent = '#10b981'; }}></div>
                <div class="color-swatch ${this.activeAccent === '#f43f5e' ? 'active' : ''}" style="background:#f43f5e" @click=${() => { this.activeAccent = '#f43f5e'; }}></div>
              </div>
            </div>

            <div class="row">
              <div>
                <div class="label">Translucent Surfaces</div>
                <div class="sublabel">Glassmorphic backdrop blur and depth</div>
              </div>
              <span class="badge">Ultra Blur (32px)</span>
            </div>
          </div>
        ` : ''}

        ${this.currentTab === 'privacy' ? html`
          <h2>Application Permissions (Zero-Trust)</h2>
          <div class="section-desc">Manage sandboxed application entitlements. Changes are logged to the immutable audit log.</div>

          <div class="setting-card">
            <div class="row">
              <div>
                <div class="label">Terminal → Filesystem Access</div>
                <div class="sublabel">Allow developer shell to read and write project files</div>
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  .checked=${this.permTerminalFiles}
                  @change=${(e: any) => {
                    this.permTerminalFiles = e.target.checked;
                    this.togglePermission('terminal', 'files', this.permTerminalFiles);
                  }}
                />
                <span class="slider"></span>
              </label>
            </div>

            <div class="row">
              <div>
                <div class="label">Terminal → Network Access</div>
                <div class="sublabel">Allow outbound TCP/UDP connections from shell</div>
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  .checked=${this.permTerminalNet}
                  @change=${(e: any) => {
                    this.permTerminalNet = e.target.checked;
                    this.togglePermission('terminal', 'network', this.permTerminalNet);
                  }}
                />
                <span class="slider"></span>
              </label>
            </div>

            <div class="row">
              <div>
                <div class="label">NOVA Intelligence → System Telemetry</div>
                <div class="sublabel">Allow assistant to inspect hardware load and memory stats</div>
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  .checked=${this.permAssistantSystem}
                  @change=${(e: any) => {
                    this.permAssistantSystem = e.target.checked;
                    this.togglePermission('ai-assistant', 'system', this.permAssistantSystem);
                  }}
                />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        ` : ''}

        ${this.currentTab === 'ai' ? html`
          <h2>NOVA Intelligence Configuration</h2>
          <div class="section-desc">Configure local private inference and optional cloud provider adapters.</div>

          <div class="setting-card">
            <div class="row">
              <div>
                <div class="label">Local Inference Engine</div>
                <div class="sublabel">Ollama-compatible local server (http://localhost:11434)</div>
              </div>
              <span class="badge">Default Active</span>
            </div>
            <div class="row">
              <div>
                <div class="label">Gemini Provider Adapter</div>
                <div class="sublabel">Reads API key securely from NOVA_GEMINI_API_KEY env var</div>
              </div>
              <span class="badge">Configured</span>
            </div>
          </div>
        ` : ''}

        ${this.currentTab === 'a11y' ? html`
          <h2>Accessibility & Assistance</h2>
          <div class="section-desc">WCAG 2.2 AA compliant perceptual adjustments and navigation aids.</div>

          <div class="setting-card">
            <div class="row">
              <div>
                <div class="label">High Contrast Mode</div>
                <div class="sublabel">Elevate border luminance and text contrast ratio to > 7:1</div>
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  .checked=${this.highContrast}
                  @change=${(e: any) => { this.highContrast = e.target.checked; }}
                />
                <span class="slider"></span>
              </label>
            </div>

            <div class="row">
              <div>
                <div class="label">Reduced Motion</div>
                <div class="sublabel">Disable particle starfield and window opening springs</div>
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  .checked=${this.reducedMotion}
                  @change=${(e: any) => { this.reducedMotion = e.target.checked; }}
                />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        ` : ''}

        ${this.currentTab === 'about' ? html`
          <h2>System Information</h2>
          <div class="section-desc">Operating system distribution, kernel details, and hardware topology.</div>

          <div class="setting-card">
            <div class="row">
              <div>
                <div class="label">Distribution</div>
                <div class="sublabel">Atomic Linux Foundation (bootc / rpm-ostree)</div>
              </div>
              <span class="badge">${this.systemMetrics?.osVersion || 'NOVA OS 0.1.0-alpha'}</span>
            </div>
            <div class="row">
              <div>
                <div class="label">Kernel</div>
                <div class="sublabel">Linux 64-bit with preempt dynamic</div>
              </div>
              <span class="badge">${this.systemMetrics?.kernelVersion || '6.11.0-nova'}</span>
            </div>
            <div class="row">
              <div>
                <div class="label">Host Machine</div>
                <div class="sublabel">${this.systemMetrics?.cpuModel || 'x86_64 Processor'}</div>
              </div>
              <span class="badge">${this.systemMetrics?.hostname || 'nova-workstation'}</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}
