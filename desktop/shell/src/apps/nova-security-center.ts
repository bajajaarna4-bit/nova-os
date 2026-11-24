// nova-security-center.ts — Security posture and policy inspection
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { novaApi, type SecurityStatusReport } from '../services/nova-api.js';

@customElement('nova-security-center')
export class NovaSecurityCenter extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--nova-bg-surface);
      color: var(--nova-text-primary);
      font-family: var(--nova-font-ui);
      padding: 24px;
      box-sizing: border-box;
      overflow-y: auto;
    }
    h2 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--nova-border);
      border-radius: var(--nova-radius-md);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .card-title {
      font-size: 13px;
      color: var(--nova-text-secondary);
    }
    .card-value {
      font-size: 16px;
      font-weight: 600;
    }
    .status-good { color: #34d399; }
    .status-warn { color: #fbbf24; }
    .status-unknown { color: var(--nova-text-muted); }
  `;

  @state() private sec: SecurityStatusReport | null = null;

  async connectedCallback() {
    super.connectedCallback();
    this.sec = await novaApi.getSecurityStatus();
  }

  render() {
    return html`
      <h2>Security & Integrity Status</h2>
      <div class="grid">
        <div class="card">
          <span class="card-title">SELinux Policy</span>
          <span class="card-value status-good">${this.sec?.selinuxMode ?? 'Checking...'}</span>
        </div>
        <div class="card">
          <span class="card-title">Secure Boot</span>
          <span class="card-value ${this.sec?.secureBoot ? 'status-good' : 'status-unknown'}">
            ${this.sec?.secureBoot === null ? 'Platform Dependent' : this.sec?.secureBoot ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div class="card">
          <span class="card-title">Disk Encryption (LUKS)</span>
          <span class="card-value ${this.sec?.dmCrypt ? 'status-good' : 'status-warn'}">
            ${this.sec?.dmCrypt ? 'Active' : 'Unencrypted'}
          </span>
        </div>
        <div class="card">
          <span class="card-title">Network Firewall</span>
          <span class="card-value status-good">
            ${this.sec?.firewallActive ? 'Enforcing' : 'Inactive'}
          </span>
        </div>
      </div>
    `;
  }
}
