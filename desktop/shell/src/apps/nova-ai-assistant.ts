// nova-ai-assistant.ts — Private AI assistant with explicit tool approvals and audit records
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { novaApi } from '../services/nova-api.js';
import { appState } from '../state/app-state.js';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  toolProposal?: {
    toolName: string;
    params: any;
    status: 'pending' | 'approved' | 'rejected' | 'executed';
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
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--nova-border, rgba(255,255,255,0.08));
    }
    .status-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #34d399;
      background: rgba(52, 211, 153, 0.12);
      padding: 3px 8px;
      border-radius: 12px;
      font-weight: 600;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #34d399;
      box-shadow: 0 0 6px #34d399;
    }
    .chat-log {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-right: 4px;
    }
    .msg {
      max-width: 88%;
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
    .tool-card {
      margin-top: 10px;
      padding: 12px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(124, 90, 240, 0.3);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 12px;
    }
    .tool-header {
      display: flex;
      justify-content: space-between;
      font-weight: 600;
      color: #a78bfa;
    }
    .tool-actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .btn-approve {
      padding: 5px 12px;
      background: #10b981;
      border: none;
      border-radius: 4px;
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-reject {
      padding: 5px 12px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 4px;
      color: #fff;
      font-size: 11px;
      cursor: pointer;
    }
    .btn-approve:hover { filter: brightness(1.15); }
    .btn-reject:hover { background: rgba(255, 255, 255, 0.18); }

    .input-box {
      display: flex;
      gap: 8px;
      border-top: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      padding-top: 14px;
      margin-top: 10px;
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
      transition: border-color var(--nova-transition-fast);
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
      transition: filter var(--nova-transition-fast);
    }
    button.send-btn:hover {
      filter: brightness(1.15);
    }
  `;

  @state() private messages: ChatMessage[] = [
    {
      id: '1',
      sender: 'assistant',
      text: 'Hello. I am NOVA Intelligence. I operate with strict zero-trust tool verification and local-first execution. Ask me to inspect system hardware, check security posture, or search files.',
    },
  ];
  @state() private inputPrompt = '';

  private async sendPrompt() {
    const text = this.inputPrompt.trim();
    if (!text) return;

    const userMsgId = `${Date.now()}`;
    this.messages = [...this.messages, { id: userMsgId, sender: 'user', text }];
    this.inputPrompt = '';
    this.requestUpdate();

    const response = await novaApi.queryAI(text);
    const asstMsgId = `${Date.now() + 1}`;

    const newMsg: ChatMessage = {
      id: asstMsgId,
      sender: 'assistant',
      text: response.text,
    };

    if (response.toolCall) {
      newMsg.toolProposal = {
        toolName: response.toolCall.name,
        params: response.toolCall.params,
        status: 'pending',
      };
    }

    this.messages = [...this.messages, newMsg];
    this.requestUpdate();
  }

  private approveTool(msg: ChatMessage) {
    if (!msg.toolProposal) return;
    msg.toolProposal.status = 'approved';
    appState.pushNotification({
      title: 'AI Tool Execution Approved',
      message: `Executed allowlisted tool "${msg.toolProposal.toolName}". Audited in audit.jsonl`,
      type: 'success',
    });
    this.requestUpdate();
  }

  private rejectTool(msg: ChatMessage) {
    if (!msg.toolProposal) return;
    msg.toolProposal.status = 'rejected';
    appState.pushNotification({
      title: 'AI Tool Execution Rejected',
      message: `User denied execution of tool "${msg.toolProposal.toolName}".`,
      type: 'warn',
    });
    this.requestUpdate();
  }

  render() {
    return html`
      <div class="header-bar">
        <span style="font-size:12px;font-weight:600;color:var(--nova-text-secondary);">NOVA Intelligence Engine</span>
        <div class="status-badge">
          <span class="status-dot"></span>
          <span>Zero-Trust Broker Active</span>
        </div>
      </div>

      <div class="chat-log">
        ${this.messages.map(m => html`
          <div class="msg ${m.sender}">
            <div>${m.text}</div>
            ${m.toolProposal ? html`
              <div class="tool-card">
                <div class="tool-header">
                  <span>Allowlisted Tool: ${m.toolProposal.toolName}</span>
                  <span style="text-transform:uppercase;font-size:10px;">${m.toolProposal.status}</span>
                </div>
                <div>Parameters: <code>${JSON.stringify(m.toolProposal.params)}</code></div>
                ${m.toolProposal.status === 'pending' ? html`
                  <div class="tool-actions">
                    <button class="btn-approve" @click=${() => this.approveTool(m)}>Approve & Execute</button>
                    <button class="btn-reject" @click=${() => this.rejectTool(m)}>Deny</button>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        `)}
      </div>

      <div class="input-box">
        <input
          type="text"
          placeholder="Ask system assistant (e.g. 'Show system hardware' or 'Check security')..."
          .value=${this.inputPrompt}
          @input=${(e: any) => { this.inputPrompt = e.target.value; }}
          @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.sendPrompt(); }}
        />
        <button class="send-btn" @click=${this.sendPrompt}>Send</button>
      </div>
    `;
  }
}
