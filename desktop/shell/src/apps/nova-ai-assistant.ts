// nova-ai-assistant.ts — Native AI Assistant with streaming, provider selection, action confirmation, and audit history
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { novaApi, type AIAuditEntry, type AIProviderMode, type AIToolProposal } from '../services/nova-api.js';
import { appState } from '../state/app-state.js';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  streaming?: boolean;
  providerInfo?: {
    provider: string;
    model: string;
    isFallback: boolean;
    latencyMs: number;
  };
  toolProposal?: {
    proposal: AIToolProposal;
    status: 'pending' | 'approved' | 'rejected' | 'executed';
    executionResult?: any;
  };
}

@customElement('nova-ai-assistant')
export class NovaAiAssistant extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--nova-bg-surface, #141628);
      color: var(--nova-text-primary, #fff);
      font-family: var(--nova-font-ui, system-ui, sans-serif);
      padding: 16px;
      box-sizing: border-box;
      user-select: text;
    }

    /* Header Bar */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      margin-bottom: 10px;
      border-bottom: 1px solid var(--nova-border, rgba(255,255,255,0.08));
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }
    .provider-pill {
      font-size: 11px;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
    }
    .header-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mode-select {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.1));
      color: #fff;
      font-size: 11px;
      border-radius: 6px;
      padding: 3px 6px;
      outline: none;
      cursor: pointer;
    }
    .mode-select option {
      background: #141628;
      color: #fff;
    }
    .tab-btn {
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 600;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 6px;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
      cursor: pointer;
      transition: all var(--nova-transition-fast, 120ms);
    }
    .tab-btn.active {
      background: rgba(124, 90, 240, 0.25);
      border-color: rgba(124, 90, 240, 0.4);
      color: #fff;
    }
    .net-btn {
      padding: 3px 8px;
      font-size: 11px;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.06);
      color: #fff;
    }
    .net-btn.offline-sim {
      background: rgba(239, 68, 68, 0.2);
      border-color: #ef4444;
      color: #fca5a5;
    }

    /* Offline Alert Banner */
    .offline-banner {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fcd34d;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 11px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Chat Log */
    .chat-log {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-right: 4px;
    }
    .msg {
      max-width: 90%;
      padding: 12px 16px;
      border-radius: var(--nova-radius-md, 12px);
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .msg.user {
      align-self: flex-end;
      background: var(--nova-accent-violet, #7c5af0);
      color: #fff;
      box-shadow: 0 4px 16px rgba(124, 90, 240, 0.3);
    }
    .msg.assistant {
      align-self: flex-start;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
    }
    .msg-meta {
      font-size: 10px;
      color: var(--nova-text-muted, rgba(255,255,255,0.5));
      margin-top: 6px;
      display: flex;
      gap: 10px;
    }
    .cursor {
      display: inline-block;
      width: 7px;
      height: 14px;
      background: #7c5af0;
      margin-left: 2px;
      vertical-align: middle;
      animation: blink 0.8s infinite;
    }
    @keyframes blink { 50% { opacity: 0; } }

    /* Tool Confirmation Card */
    .tool-card {
      margin-top: 10px;
      padding: 14px;
      background: rgba(10, 11, 22, 0.6);
      border: 1px solid rgba(124, 90, 240, 0.35);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 12px;
    }
    .tool-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }
    .risk-badge {
      font-size: 10px;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
    }
    .risk-badge.low {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .risk-badge.medium, .risk-badge.high {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .param-box {
      background: rgba(0, 0, 0, 0.4);
      padding: 8px 10px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 11px;
      color: #cbd5e1;
      max-height: 100px;
      overflow-y: auto;
    }
    .tool-actions {
      display: flex;
      gap: 10px;
      margin-top: 4px;
    }
    .btn-approve {
      padding: 7px 14px;
      background: #10b981;
      border: none;
      border-radius: 6px;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: filter 0.15s;
    }
    .btn-approve:hover { filter: brightness(1.15); }
    .btn-reject {
      padding: 7px 14px;
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: 6px;
      color: #fca5a5;
      font-size: 12px;
      cursor: pointer;
    }
    .btn-reject:hover { background: rgba(239, 68, 68, 0.3); }

    /* Suggested Quick Prompts */
    .prompt-suggestions {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding: 6px 0;
      margin-top: 6px;
      scrollbar-width: none;
    }
    .prompt-suggestions::-webkit-scrollbar {
      display: none;
    }
    .prompt-chip {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      color: var(--nova-text-secondary, rgba(255,255,255,0.8));
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .prompt-chip:hover {
      background: rgba(124, 90, 240, 0.2);
      border-color: rgba(124, 90, 240, 0.4);
      color: #fff;
    }

    /* Input Box */
    .input-box {
      display: flex;
      gap: 8px;
      border-top: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      padding-top: 10px;
    }
    input {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: var(--nova-radius-sm, 6px);
      padding: 10px 14px;
      color: #fff;
      font-family: inherit;
      font-size: 13px;
      outline: none;
    }
    input:focus {
      border-color: var(--nova-accent-violet, #7c5af0);
    }
    button.send-btn {
      padding: 10px 18px;
      background: var(--nova-accent-gradient, linear-gradient(135deg, #7c5af0, #3b82f6));
      border: none;
      border-radius: var(--nova-radius-sm, 6px);
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
    }
    button.send-btn:hover { filter: brightness(1.15); }

    /* Activity History View */
    .audit-table {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-right: 4px;
    }
    .audit-row {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.06));
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 12px;
    }
    .audit-row-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
    }
    .audit-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .audit-badge.success { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .audit-badge.denied { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
  `;

  @state() private activeTab: 'chat' | 'history' = 'chat';
  @state() private providerMode: AIProviderMode = 'auto';
  @state() private simulateOffline = false;
  @state() private inputPrompt = '';
  @state() private isGenerating = false;
  @state() private auditLogs: AIAuditEntry[] = [];
  @state() private messages: ChatMessage[] = [
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Hello. I am NOVA Intelligence. I operate with strict zero-trust tool verification and local-first execution. Consequential actions (launching apps, opening documents) require your explicit approval.',
      providerInfo: {
        provider: 'Offline Built-in Engine',
        model: 'nova-builtin-rules-v1',
        isFallback: false,
        latencyMs: 1,
      },
    },
  ];

  connectedCallback() {
    super.connectedCallback();
    this.providerMode = novaApi.getProviderMode();
    this.simulateOffline = novaApi.isNetworkLossSimulated();
    this.auditLogs = novaApi.getAuditLog();
  }

  private handleModeChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value as AIProviderMode;
    this.providerMode = val;
    novaApi.setProviderMode(val);
  }

  private toggleOfflineSim() {
    this.simulateOffline = !this.simulateOffline;
    novaApi.setSimulateNetworkLoss(this.simulateOffline);
    appState.pushNotification({
      title: this.simulateOffline ? 'Simulating Network Disconnect' : 'Network Reconnected',
      message: this.simulateOffline
        ? 'External cloud API is blocked. AI queries will automatically fallback to local offline intelligence.'
        : 'Cloud connectivity restored.',
      type: this.simulateOffline ? 'warn' : 'info',
    });
  }

  private async submitPrompt(promptText: string) {
    const text = promptText.trim();
    if (!text || this.isGenerating) return;

    this.inputPrompt = '';
    const userMsgId = `user-${Date.now()}`;
    const asstMsgId = `asst-${Date.now()}`;

    // Add user message and empty streaming assistant message
    this.messages = [
      ...this.messages,
      { id: userMsgId, sender: 'user', text },
      { id: asstMsgId, sender: 'assistant', text: '', streaming: true },
    ];
    this.isGenerating = true;
    this.requestUpdate();

    try {
      let accumulated = '';
      const result = await novaApi.queryAIStream(text, (chunk) => {
        accumulated += chunk;
        const target = this.messages.find(m => m.id === asstMsgId);
        if (target) {
          target.text = accumulated;
          this.requestUpdate();
        }
      });

      const finalMsg = this.messages.find(m => m.id === asstMsgId);
      if (finalMsg) {
        finalMsg.streaming = false;
        finalMsg.providerInfo = {
          provider: result.providerUsed,
          model: result.modelUsed,
          isFallback: result.isFallback,
          latencyMs: result.latencyMs,
        };

        if (result.toolCall) {
          finalMsg.toolProposal = {
            proposal: result.toolCall,
            status: 'pending',
          };
        }
      }
    } catch (err: any) {
      const finalMsg = this.messages.find(m => m.id === asstMsgId);
      if (finalMsg) {
        finalMsg.streaming = false;
        finalMsg.text = `⚠️ Error: ${err.message}. Network loss detected. Please switch to Auto or Offline mode.`;
      }
    } finally {
      this.isGenerating = false;
      this.auditLogs = novaApi.getAuditLog();
      this.requestUpdate();
    }
  }

  private async approveTool(msg: ChatMessage) {
    if (!msg.toolProposal) return;
    const proposal = msg.toolProposal.proposal;
    msg.toolProposal.status = 'approved';

    const execRes = await novaApi.executeTool(proposal.name, proposal.params, true);
    msg.toolProposal.executionResult = execRes.output;
    msg.toolProposal.status = 'executed';

    // If launching application, trigger desktop open
    if (proposal.name === 'launch_application' && proposal.params.app_id) {
      appState.openApp(proposal.params.app_id);
    } else if (proposal.name === 'navigate_settings') {
      appState.openApp('settings');
    }

    appState.pushNotification({
      title: 'AI Tool Execution Confirmed',
      message: `Executed allowlisted tool "${proposal.name}". Recorded in audit.jsonl`,
      type: 'success',
    });

    this.auditLogs = novaApi.getAuditLog();
    this.requestUpdate();
  }

  private async rejectTool(msg: ChatMessage) {
    if (!msg.toolProposal) return;
    const proposal = msg.toolProposal.proposal;
    msg.toolProposal.status = 'rejected';

    await novaApi.executeTool(proposal.name, proposal.params, false);

    appState.pushNotification({
      title: 'AI Tool Execution Denied',
      message: `User rejected consequential tool "${proposal.name}". Access blocked.`,
      type: 'warn',
    });

    this.auditLogs = novaApi.getAuditLog();
    this.requestUpdate();
  }

  render() {
    return html`
      <!-- Header -->
      <div class="header-bar">
        <div class="header-left">
          <span class="title">NOVA Intelligence</span>
          <span class="provider-pill">${this.providerMode.toUpperCase()}</span>
        </div>

        <div class="header-controls">
          <select class="mode-select" .value=${this.providerMode} @change=${this.handleModeChange} title="AI Provider Selection">
            <option value="auto">Auto (Cloud with Fallback)</option>
            <option value="gemini">Gemini Cloud Only</option>
            <option value="ollama">Ollama Local Daemon</option>
            <option value="offline">Offline Built-in Engine</option>
          </select>

          <button
            class="net-btn ${this.simulateOffline ? 'offline-sim' : ''}"
            @click=${this.toggleOfflineSim}
            title="Toggle simulated network loss to test offline fallback"
          >
            ${this.simulateOffline ? '🔌 Offline' : '🌐 Online'}
          </button>

          <button
            class="tab-btn ${this.activeTab === 'chat' ? 'active' : ''}"
            @click=${() => { this.activeTab = 'chat'; }}
          >Chat</button>
          <button
            class="tab-btn ${this.activeTab === 'history' ? 'active' : ''}"
            @click=${() => { this.activeTab = 'history'; this.auditLogs = novaApi.getAuditLog(); }}
          >Audit History (${this.auditLogs.length})</button>
        </div>
      </div>

      <!-- Offline Warning Banner if Simulated -->
      ${this.simulateOffline ? html`
        <div class="offline-banner">
          <span>⚠️</span>
          <span><strong>Simulated Network Disconnect:</strong> External API calls will fail. Auto mode will seamlessly route to the local offline zero-trust engine.</span>
        </div>
      ` : ''}

      <!-- Main Body -->
      ${this.activeTab === 'chat' ? html`
        <div class="chat-log">
          ${this.messages.map(m => html`
            <div class="msg ${m.sender}">
              <div>${m.text}${m.streaming ? html`<span class="cursor"></span>` : ''}</div>

              ${m.providerInfo ? html`
                <div class="msg-meta">
                  <span>Provider: ${m.providerInfo.provider}</span>
                  ${m.providerInfo.isFallback ? html`<span style="color:#fcd34d;">(Automatic Fallback)</span>` : ''}
                  <span>Latency: ${m.providerInfo.latencyMs}ms</span>
                </div>
              ` : ''}

              ${m.toolProposal ? html`
                <div class="tool-card">
                  <div class="tool-header">
                    <span>Tool Proposal: <strong>${m.toolProposal.proposal.name}</strong></span>
                    <span class="risk-badge ${m.toolProposal.proposal.risk}">
                      ${m.toolProposal.proposal.consequential ? 'Consequential Action' : 'Low Risk'}
                    </span>
                  </div>
                  <div style="color:var(--nova-text-secondary);font-size:11px;">
                    ${m.toolProposal.proposal.description}
                  </div>
                  <div class="param-box">
                    Parameters: ${JSON.stringify(m.toolProposal.proposal.params, null, 2)}
                  </div>

                  ${m.toolProposal.status === 'pending' ? html`
                    <div class="tool-actions">
                      <button class="btn-approve" @click=${() => this.approveTool(m)}>
                        ✓ Approve & Execute
                      </button>
                      <button class="btn-reject" @click=${() => this.rejectTool(m)}>
                        ✕ Deny / Reject
                      </button>
                    </div>
                  ` : html`
                    <div style="font-size:11px;font-weight:600;color:${m.toolProposal.status === 'executed' ? '#34d399' : '#f87171'};">
                      ${m.toolProposal.status === 'executed' ? '✓ Executed & Logged in Audit Trail' : '✕ Denied by User Policy'}
                    </div>
                  `}
                </div>
              ` : ''}
            </div>
          `)}
        </div>

        <!-- Quick Prompts Chips -->
        <div class="prompt-suggestions">
          <button class="prompt-chip" @click=${() => this.submitPrompt('Inspect system hardware metrics')}>💻 Inspect Hardware</button>
          <button class="prompt-chip" @click=${() => this.submitPrompt('Check security posture and SELinux status')}>🛡️ Security Posture</button>
          <button class="prompt-chip" @click=${() => this.submitPrompt('Launch Terminal')}>⚡ Launch Terminal</button>
          <button class="prompt-chip" @click=${() => this.submitPrompt('Search project files')}>📁 Search Files</button>
          <button class="prompt-chip" @click=${() => this.submitPrompt('Open privacy settings')}>⚙️ Privacy Settings</button>
        </div>

        <!-- Input Box -->
        <div class="input-box">
          <input
            type="text"
            placeholder="Ask NOVA Intelligence (e.g. 'Launch Terminal', 'Check security', 'Inspect hardware')..."
            .value=${this.inputPrompt}
            @input=${(e: any) => { this.inputPrompt = e.target.value; }}
            @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.submitPrompt(this.inputPrompt); }}
          />
          <button class="send-btn" @click=${() => this.submitPrompt(this.inputPrompt)} ?disabled=${this.isGenerating}>
            ${this.isGenerating ? 'Streaming...' : 'Send'}
          </button>
        </div>
      ` : html`
        <!-- Activity History Tab -->
        <div class="audit-table">
          <div style="font-size:12px;color:var(--nova-text-secondary);margin-bottom:8px;">
            Immutable zero-trust audit trail recorded to <code>~/.local/share/nova/audit.jsonl</code>:
          </div>
          ${this.auditLogs.map(log => html`
            <div class="audit-row">
              <div class="audit-row-header">
                <span><strong>${log.action}</strong> ${log.toolName ? `(${log.toolName})` : ''}</span>
                <span>${log.timestamp}</span>
              </div>
              <div style="margin-bottom:4px;color:#cbd5e1;">${log.details}</div>
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;">
                <span style="color:var(--nova-text-muted);">Provider: ${log.provider}</span>
                <span class="audit-badge ${log.outcome}">${log.outcome.toUpperCase()}</span>
              </div>
            </div>
          `)}
        </div>
      `}
    `;
  }
}
